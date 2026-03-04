import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { server } from '../src/server.js';

// Helper: stub globalThis.fetch with a static JSON response
function mockFetch(data: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
    text: () => Promise.resolve(JSON.stringify(data)),
  }));
}

// Helper: call a tool via the MCP client and return the parsed result
async function callTool(client: Client, name: string, args: Record<string, unknown>) {
  return client.request(
    { method: 'tools/call', params: { name, arguments: args } },
    CallToolResultSchema
  );
}

describe('Loxo MCP tool handlers', () => {
  let client: Client;

  beforeEach(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await client.close();
  });

  // ─── loxo_get_activity_types ───────────────────────────────────────────────

  describe('loxo_get_activity_types', () => {
    it('returns activity types list', async () => {
      mockFetch([{ id: 1, name: 'Call' }, { id: 2, name: 'Email' }]);
      const result = await callTool(client, 'loxo_get_activity_types', {});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Call');
    });
  });

  // ─── loxo_search_candidates ───────────────────────────────────────────────

  describe('loxo_search_candidates', () => {
    it('returns candidate list on successful search', async () => {
      mockFetch({
        people: [{ id: '42', name: 'Jane Smith', current_title: 'Engineer', current_company: 'Acme' }],
        total_count: 1,
        scroll_id: null,
      });
      const result = await callTool(client, 'loxo_search_candidates', { query: 'Jane' });
      expect(result.isError).toBeFalsy();
      // Tool wraps results in { results, pagination } structure
      expect(result.content[0].text).toContain('Jane Smith');
      expect(result.content[0].text).toContain('"total_count": 1');
    });

    it('returns empty results when no matches', async () => {
      mockFetch({ people: [], total_count: 0, scroll_id: null });
      const result = await callTool(client, 'loxo_search_candidates', {});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('"total_count": 0');
    });
  });

  // ─── loxo_get_candidate ───────────────────────────────────────────────────

  describe('loxo_get_candidate', () => {
    it('returns candidate profile', async () => {
      mockFetch({ id: '42', name: 'Jane Smith', location: 'London' });
      const result = await callTool(client, 'loxo_get_candidate', { id: '42' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Jane Smith');
    });

    it('returns error for non-existent candidate', async () => {
      mockFetch({ error: 'not found' }, 404);
      const result = await callTool(client, 'loxo_get_candidate', { id: '99999' });
      expect(result.isError).toBe(true);
      // formatApiError for 404 produces: "Resource not found: The <id> ID does not exist."
      expect(result.content[0].text).toContain('not found');
    });
  });

  // ─── loxo_get_candidate_brief ─────────────────────────────────────────────

  describe('loxo_get_candidate_brief', () => {
    it('returns combined profile, emails, phones, activities', async () => {
      // loxo_get_candidate_brief fires 4 parallel fetches via Promise.all.
      // We match by URL substring to return the correct payload for each request.
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        let data: unknown;
        if (url.includes('/emails')) {
          data = [{ value: 'jane@example.com' }];
        } else if (url.includes('/phones')) {
          data = [{ value: '+44 7700 900000' }];
        } else if (url.includes('person_events')) {
          data = { person_events: [{ id: 1, notes: 'Called re: role' }] };
        } else {
          // profile endpoint: /people/42
          data = { id: '42', name: 'Jane Smith' };
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }));

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Jane Smith');
      expect(result.content[0].text).toContain('jane@example.com');
      expect(result.content[0].text).toContain('recent_activities');
    });
  });

  // ─── loxo_get_candidate_activities ───────────────────────────────────────

  describe('loxo_get_candidate_activities', () => {
    it('returns paginated activity list', async () => {
      mockFetch({
        person_events: [{ id: 1, notes: 'Called', created_at: '2026-01-01' }],
        total_count: 1,
        scroll_id: null,
      });
      const result = await callTool(client, 'loxo_get_candidate_activities', { person_id: '42' });
      expect(result.isError).toBeFalsy();
      // Tool wraps in { results, pagination }
      expect(result.content[0].text).toContain('Called');
    });
  });

  // ─── loxo_search_jobs ─────────────────────────────────────────────────────

  describe('loxo_search_jobs', () => {
    it('returns job list', async () => {
      mockFetch({ jobs: [{ id: 1, title: 'Senior Engineer' }], total_count: 1 });
      const result = await callTool(client, 'loxo_search_jobs', { query: 'Engineer' });
      expect(result.isError).toBeFalsy();
      // Tool wraps in { results, pagination }
      expect(result.content[0].text).toContain('Senior Engineer');
    });
  });

  // ─── loxo_get_job_pipeline ────────────────────────────────────────────────

  describe('loxo_get_job_pipeline', () => {
    it('returns candidates in pipeline', async () => {
      mockFetch({
        job_contacts: [{ id: 1, person: { name: 'Jane Smith' }, stage: 'Interviewing' }],
        total_count: 1,
        scroll_id: null,
      });
      const result = await callTool(client, 'loxo_get_job_pipeline', { job_id: '100' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Jane Smith');
      // Tool includes job_id in the response wrapper
      expect(result.content[0].text).toContain('"job_id": "100"');
    });
  });

  // ─── loxo_search_companies ────────────────────────────────────────────────

  describe('loxo_search_companies', () => {
    it('returns company list', async () => {
      mockFetch({ companies: [{ id: 1, name: 'Acme Corp' }], total_count: 1, scroll_id: null });
      const result = await callTool(client, 'loxo_search_companies', { query: 'Acme' });
      expect(result.isError).toBeFalsy();
      // Tool wraps in { results, pagination }
      expect(result.content[0].text).toContain('Acme Corp');
    });
  });

  // ─── loxo_create_candidate ────────────────────────────────────────────────

  describe('loxo_create_candidate', () => {
    it('creates candidate and returns the new record', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ id: '99', name: 'TEST - Jane Doe', title: 'Engineer' })),
      }));
      const result = await callTool(client, 'loxo_create_candidate', {
        name: 'TEST - Jane Doe',
        email: 'test-jane@example.com',
        current_title: 'Engineer',
        tags: 'test-record,ci-test',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('TEST - Jane Doe');
    });

    it('returns error when required name is missing', async () => {
      const result = await callTool(client, 'loxo_create_candidate', {
        email: 'no-name@example.com',
      });
      expect(result.isError).toBe(true);
    });
  });

  // ─── loxo_update_candidate ────────────────────────────────────────────────

  describe('loxo_update_candidate', () => {
    it('updates candidate and returns updated record', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ id: '42', name: 'Jane Smith', title: 'Senior Engineer' })),
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        current_title: 'Senior Engineer',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Senior Engineer');
    });

    it('returns error when only id is provided (empty body guard)', async () => {
      const result = await callTool(client, 'loxo_update_candidate', { id: '42' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No fields provided to update');
    });
  });

  // ─── loxo_apply_to_job ────────────────────────────────────────────────────

  describe('loxo_apply_to_job', () => {
    it('adds candidate to job pipeline', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ id: 1, person_id: '42', job_id: '100' })),
      }));
      const result = await callTool(client, 'loxo_apply_to_job', {
        job_id: '100',
        person_id: '42',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('"person_id": "42"');
    });

    it('returns error when job_id is missing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve(JSON.stringify({ error: 'job_id is required' })),
      }));
      const result = await callTool(client, 'loxo_apply_to_job', { person_id: '42' });
      expect(result.isError).toBe(true);
    });
  });

  // ─── loxo_log_activity ────────────────────────────────────────────────────

  describe('loxo_log_activity', () => {
    it('logs activity successfully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ id: 5, activity_type_id: '1', notes: 'Test call logged' })),
      }));
      const result = await callTool(client, 'loxo_log_activity', {
        person_id: '42',
        activity_type_id: '1',
        notes: 'Test call logged',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Test call logged');
    });
  });
});
