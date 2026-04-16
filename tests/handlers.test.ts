import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
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
    vi.unstubAllEnvs();
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
      const text = result.content[0].text as string;
      expect(text).toContain('Jane Smith');
      expect(text).toContain('jane@example.com');
      expect(text).toContain('recent_activities');
      expect(text).toContain('activity_pagination');
    });
  });

  // ─── loxo_get_candidate_brief (filtered activities) ─────────────────────

  describe('loxo_get_candidate_brief filtered activities', () => {
    // Helper to create a mock fetch that returns specific activities
    function mockBriefFetch(activities: unknown[], scrollId: string | null = null) {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        let data: unknown;
        if (url.includes('/emails')) {
          data = [{ value: 'test@example.com' }];
        } else if (url.includes('/phones')) {
          data = [{ value: '+44 7700 900000' }];
        } else if (url.includes('person_events')) {
          data = { person_events: activities, scroll_id: scrollId, total_count: activities.length };
        } else {
          data = { id: '42', name: 'Test Candidate', description: 'Intake notes here' };
        }
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }));
    }

    it('excludes noise activity types from results', async () => {
      mockBriefFetch([
        { id: 1, notes: 'Called re: role', activity_type_id: 1550062 },   // Outgoing Phone Call - intel
        { id: 2, notes: '', activity_type_id: 1550055 },                  // Added to Job - noise
        { id: 3, notes: 'Discussed salary', activity_type_id: 1550051 },  // Note Update - intel
        { id: 4, notes: '', activity_type_id: 1550079 },                  // Hired - noise
      ]);

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.recent_activities).toHaveLength(2);
      expect(parsed.recent_activities[0].id).toBe(1);
      expect(parsed.recent_activities[1].id).toBe(3);
    });

    it('returns empty activities when all are noise', async () => {
      mockBriefFetch([
        { id: 1, notes: '', activity_type_id: 1550055 },  // Added to Job
        { id: 2, notes: '', activity_type_id: 1550079 },  // Hired
        { id: 3, notes: '', activity_type_id: 2925520 },  // CRM Agent
      ]);

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.recent_activities).toHaveLength(0);
    });

    it('includes activity_pagination in response', async () => {
      mockBriefFetch(
        [{ id: 1, notes: 'Called', activity_type_id: 1550062 }],
        'abc123'
      );

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.activity_pagination).toBeDefined();
      expect(parsed.activity_pagination.scroll_id).toBe('abc123');
      expect(parsed.activity_pagination.has_more).toBe(true);
    });

    it('sets has_more false when no scroll_id from API', async () => {
      mockBriefFetch(
        [{ id: 1, notes: 'Called', activity_type_id: 1550062 }],
        null
      );

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.activity_pagination.has_more).toBe(false);
      expect(parsed.activity_pagination.scroll_id).toBeNull();
    });

    it('passes scroll_id to API for pagination', async () => {
      mockBriefFetch([{ id: 10, notes: 'Older call', activity_type_id: 1550063 }]);

      await callTool(client, 'loxo_get_candidate_brief', { id: '42', scroll_id: 'page2cursor' });

      const fetchCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const eventsCall = fetchCalls.find(([url]: [string]) => url.includes('person_events'));
      expect(eventsCall).toBeDefined();
      expect(eventsCall![0]).toContain('scroll_id=page2cursor');
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

    it('forwards activity_type_ids[] as repeated query params', async () => {
      let capturedUrl = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person_events: [], total_count: 0, scroll_id: null })),
        });
      }));
      const result = await callTool(client, 'loxo_get_candidate_activities', {
        person_id: '42',
        activity_type_ids: ['7', '11'],
      });
      expect(result.isError).toBeFalsy();
      expect(capturedUrl).toContain('activity_type_ids%5B%5D=7');
      expect(capturedUrl).toContain('activity_type_ids%5B%5D=11');
    });

    it('omits activity_type_ids when not provided (backward compat)', async () => {
      let capturedUrl = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person_events: [], total_count: 0, scroll_id: null })),
        });
      }));
      const result = await callTool(client, 'loxo_get_candidate_activities', { person_id: '42' });
      expect(result.isError).toBeFalsy();
      expect(capturedUrl).not.toContain('activity_type_ids');
    });

    it('rejects non-numeric activity_type_ids element', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_get_candidate_activities', {
        person_id: '42',
        activity_type_ids: ['abc'],
      });
      expect(result.isError).toBe(true);
    });

    it('rejects empty activity_type_ids array', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_get_candidate_activities', {
        person_id: '42',
        activity_type_ids: [],
      });
      expect(result.isError).toBe(true);
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
        candidates: [{ id: 1, person: { name: 'Jane Smith' }, workflow_stage_id: 1 }],
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

  // ─── loxo_create_company ──────────────────────────────────────────────────

  describe('loxo_create_company', () => {
    it('is listed in tools/list', async () => {
      const result = await client.request({ method: 'tools/list' }, ListToolsResultSchema);
      const tool = result.tools.find((t) => t.name === 'loxo_create_company');
      expect(tool).toBeDefined();
    });

    it('POSTs company[name] form-encoded to /companies', async () => {
      let capturedUrl = '';
      let capturedMethod = '';
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
        capturedUrl = url;
        capturedMethod = opts?.method || 'GET';
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ company: { id: 500, name: 'TEST - Acme' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_company', { name: 'TEST - Acme' });
      expect(result.isError).toBeFalsy();
      expect(capturedMethod).toBe('POST');
      expect(capturedUrl).toContain('/test-agency/companies');
      expect(capturedBody).toBe('company%5Bname%5D=TEST+-+Acme');
    });

    it('rejects missing name', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_create_company', {});
      expect(result.isError).toBe(true);
    });

    it('rejects whitespace-only name', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_create_company', { name: '   ' });
      expect(result.isError).toBe(true);
    });
  });

  // ─── loxo_create_candidate ────────────────────────────────────────────────

  describe('loxo_create_candidate', () => {
    it('sends person[email] and person[phone] (not bracket-array notation)', async () => {
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({
            person: { id: 99, name: 'TEST - Jane Doe', emails: [{ value: 'jane@test.com' }], phones: [{ value: '447700900000' }] }
          })),
        });
      }));
      const result = await callTool(client, 'loxo_create_candidate', {
        name: 'TEST - Jane Doe',
        email: 'jane@test.com',
        phone: '+447700900000',
        current_title: 'Analyst',
        current_company: 'Test Corp',
      });
      expect(result.isError).toBeFalsy();
      // Must use simple field names, NOT email_addresses[][value]
      expect(capturedBody).toContain('person%5Bemail%5D=');     // person[email]
      expect(capturedBody).toContain('person%5Bphone%5D=');     // person[phone]
      expect(capturedBody).not.toContain('email_addresses');
      expect(capturedBody).not.toContain('phone_numbers');
      expect(capturedBody).not.toContain('source_type_id');
    });

    it('returns error when required name is missing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_create_candidate', {
        email: 'no-name@example.com',
      });
      expect(result.isError).toBe(true);
    });

    it('applies env default owner when LOXO_DEFAULT_OWNER_ID is set and no override given', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_ID', '42');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 99, name: 'TEST - Jane' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_candidate', { name: 'TEST - Jane' });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('person%5Bowned_by_id%5D=42');
    });

    it('explicit owned_by_id overrides env default', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_ID', '42');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 99, name: 'TEST - Jane' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_candidate', {
        name: 'TEST - Jane',
        owned_by_id: '99',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('person%5Bowned_by_id%5D=99');
      expect(capturedBody).not.toContain('person%5Bowned_by_id%5D=42');
    });

    it('omits owned_by_id when neither env nor arg is provided', async () => {
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 99, name: 'TEST - Jane' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_candidate', { name: 'TEST - Jane' });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).not.toContain('owned_by_id');
    });

    it('rejects non-numeric owned_by_id', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_create_candidate', {
        name: 'TEST - Jane',
        owned_by_id: 'abc',
      });
      expect(result.isError).toBe(true);
    });

    it('silently ignores invalid LOXO_DEFAULT_OWNER_ID env value and omits owner', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_ID', 'not-a-number');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 99, name: 'TEST - Jane' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_candidate', { name: 'TEST - Jane' });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).not.toContain('owned_by_id');
    });

    it('coerces numeric owned_by_id to string before sending', async () => {
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 99, name: 'TEST - Jane' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_candidate', {
        name: 'TEST - Jane',
        owned_by_id: 99 as unknown as string,
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('person%5Bowned_by_id%5D=99');
    });
  });

  // ─── loxo_update_candidate ────────────────────────────────────────────────

  describe('loxo_update_candidate', () => {
    it('sends PUT with person[all_raw_tags][] array and person[custom_hierarchy_1][]', async () => {
      let capturedMethod = '';
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedMethod = opts?.method || 'GET';
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({
            person: { id: 42, name: 'Jane Smith', all_raw_tags: 'debt-advisory, sourced', custom_hierarchy_1: [{ id: 5704030, value: 'Debt Advisory' }] }
          })),
        });
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        current_title: 'Senior Analyst',
        tags: ['debt-advisory', 'sourced'],
        skillset_ids: [5704030],
        person_type_id: 80073,
        source_type_id: 1206583,
      });
      expect(result.isError).toBeFalsy();
      expect(capturedMethod).toBe('PUT');
      // Tags must use array notation person[all_raw_tags][]=x
      expect(capturedBody).toContain('person%5Ball_raw_tags%5D%5B%5D=debt-advisory');
      expect(capturedBody).toContain('person%5Ball_raw_tags%5D%5B%5D=sourced');
      // Skillsets use custom_hierarchy_1
      expect(capturedBody).toContain('person%5Bcustom_hierarchy_1%5D%5B%5D=5704030');
      // Person type uses singular form
      expect(capturedBody).toContain('person%5Bperson_type_id%5D=80073');
      // Source type
      expect(capturedBody).toContain('person%5Bsource_type_id%5D=1206583');
    });

    it('returns error when only id is provided (empty body guard)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_update_candidate', { id: '42' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No fields provided to update');
    });

    it('applies env default owner on update when set and no override given', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_ID', '42');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 42 } })),
        });
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        current_title: 'Senior Analyst',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('person%5Bowned_by_id%5D=42');
    });

    it('explicit owned_by_id overrides env default on update', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_ID', '42');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 42 } })),
        });
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        owned_by_id: '99',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('person%5Bowned_by_id%5D=99');
      expect(capturedBody).not.toContain('person%5Bowned_by_id%5D=42');
    });

    it('omits owned_by_id on update when neither env nor arg is set (existing tags-only update still works)', async () => {
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 42 } })),
        });
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        tags: ['debt-advisory'],
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).not.toContain('owned_by_id');
    });

    it('rejects non-numeric owned_by_id on update', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        owned_by_id: 'abc',
      });
      expect(result.isError).toBe(true);
    });

    it('accepts owned_by_id as the only field (env unset)', async () => {
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 42 } })),
        });
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        owned_by_id: '99',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('person%5Bowned_by_id%5D=99');
    });

    it('silently ignores invalid LOXO_DEFAULT_OWNER_ID env value on update and omits owner', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_ID', 'not-a-number');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ person: { id: 42 } })),
        });
      }));
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        current_title: 'Senior Analyst',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).not.toContain('owned_by_id');
    });
  });

  // ─── loxo_apply_to_job ────────────────────────────────────────────────────

  describe('loxo_add_to_pipeline', () => {
    it('creates person_event with activity_type_id 1550055 (Added to Job)', async () => {
      let capturedUrl = '';
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
        capturedUrl = url;
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({
            person_event: { id: 123, person_id: 42, job_id: 100, activity_type_id: 1550055, notes: 'Sourced from CV search' }
          })),
        });
      }));
      const result = await callTool(client, 'loxo_add_to_pipeline', {
        job_id: '100',
        person_id: '42',
        notes: 'Sourced from CV search',
      });
      expect(result.isError).toBeFalsy();
      // Must hit person_events endpoint, NOT jobs/{id}/contacts
      expect(capturedUrl).toContain('/person_events');
      expect(capturedUrl).not.toContain('/contacts');
      // Must include the "Added to Job" activity type
      expect(capturedBody).toContain('person_event%5Bactivity_type_id%5D=1550055');
      expect(capturedBody).toContain('person_event%5Bjob_id%5D=100');
      expect(capturedBody).toContain('person_event%5Bperson_id%5D=42');
    });

    it('returns error when job_id is missing', async () => {
      const result = await callTool(client, 'loxo_add_to_pipeline', { person_id: '42' });
      expect(result.isError).toBe(true);
    });

    it('returns error when person_id is missing', async () => {
      const result = await callTool(client, 'loxo_add_to_pipeline', { job_id: '100' });
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

  // ─── loxo_list_person_types ─────────────────────────────────────────────

  describe('loxo_list_person_types', () => {
    it('returns person types list', async () => {
      mockFetch([
        { id: 80073, name: 'Active Candidate' },
        { id: 78122, name: 'Prospect Candidate' },
      ]);
      const result = await callTool(client, 'loxo_list_person_types', {});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Active Candidate');
      expect(result.content[0].text).toContain('Prospect Candidate');
    });
  });

  // ─── loxo_list_source_types ─────────────────────────────────────────────

  describe('loxo_list_source_types', () => {
    it('returns source types list', async () => {
      mockFetch({ source_types: [
        { id: 1206583, name: 'LinkedIn', active: true },
        { id: 1206592, name: 'API', active: true },
      ]});
      const result = await callTool(client, 'loxo_list_source_types', {});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('LinkedIn');
      expect(result.content[0].text).toContain('API');
    });
  });

  // ─── loxo_list_skillsets ────────────────────────────────────────────────

  describe('loxo_list_skillsets', () => {
    it('returns skillset and sector hierarchies', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        let data: unknown;
        if (url.includes('2602521')) {
          data = { id: 2602521, name: 'Skillset', hierarchies: [
            { id: 5704030, name: 'Debt Advisory', hierarchies: [] },
            { id: 5690346, name: 'M&A/Lead Advisory', hierarchies: [] },
          ]};
        } else {
          data = { id: 2602522, name: 'Sector Experience', hierarchies: [
            { id: 5690362, name: 'TMT', hierarchies: [] },
            { id: 5690364, name: 'Financial Services', hierarchies: [] },
          ]};
        }
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }));
      const result = await callTool(client, 'loxo_list_skillsets', {});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Debt Advisory');
      expect(result.content[0].text).toContain('TMT');
    });
  });

  // ─── loxo_upload_resume ─────────────────────────────────────────────────

  describe('loxo_upload_resume', () => {
    it('uploads resume to /people/{id}/resumes endpoint', async () => {
      let capturedUrl = '';
      let capturedBody: any = null;
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
        capturedUrl = url;
        capturedBody = opts?.body;
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({
            id: 12345, name: 'cv.pdf', person_id: 42, created_at: '2026-03-16T12:00:00Z'
          })),
        });
      }));
      const result = await callTool(client, 'loxo_upload_resume', {
        person_id: '42',
        file_name: 'cv.pdf',
        file_content_base64: Buffer.from('fake pdf content').toString('base64'),
      });
      expect(result.isError).toBeFalsy();
      expect(capturedUrl).toContain('/people/42/resumes');
      // Body should be FormData (not URLSearchParams)
      expect(capturedBody).toBeInstanceOf(FormData);
      expect(result.content[0].text).toContain('cv.pdf');
    });

    it('returns error when person_id is missing', async () => {
      const result = await callTool(client, 'loxo_upload_resume', {
        file_name: 'cv.pdf',
        file_content_base64: Buffer.from('content').toString('base64'),
      });
      expect(result.isError).toBe(true);
    });
  });

  // ─── Tool description cross-references ──────────────────────────────────

  describe('tool descriptions guide toward candidate brief', () => {
    it('loxo_get_candidate mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        ListToolsResultSchema
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_get_candidate');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });

    it('loxo_get_candidate_activities mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        ListToolsResultSchema
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_get_candidate_activities');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });

    it('loxo_get_job_pipeline mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        ListToolsResultSchema
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_get_job_pipeline');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });

    it('loxo_search_candidates mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        ListToolsResultSchema
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_search_candidates');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });
  });
});
