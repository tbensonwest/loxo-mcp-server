# Deals Pipeline Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six new deal-pipeline tools, modify `loxo_get_activity_types` to support workflow-scoped filtering, add `LOXO_DEFAULT_OWNER_EMAIL` env var, and add MIT license.

**Architecture:** All tool logic lives in `src/server.ts` following existing patterns: Zod schema → tool definition in `ListToolsRequestSchema` → handler case in `CallToolRequestSchema`. One new helper (`resolveOwnerEmail`) near the existing `resolveOwnerId`. Config change in `src/config.ts`. Tests in `tests/handlers.test.ts` with mocked fetch.

**Tech Stack:** TypeScript, Zod, MCP SDK, Vitest

**Spec:** `docs/superpowers/specs/2026-04-20-deals-pipeline-design.md`

---

### Task 1: MIT License + package.json

**Files:**
- Create: `LICENSE`
- Modify: `package.json`

- [ ] **Step 1: Create LICENSE file**

```
MIT License

Copyright (c) 2025-present Tarran Benson-West

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Add license field to package.json**

Add `"license": "MIT"` to `package.json` (after the `"version"` field).

- [ ] **Step 3: Commit**

```bash
git add LICENSE package.json
git commit -m "chore: add MIT license"
```

---

### Task 2: Config — `LOXO_DEFAULT_OWNER_EMAIL` env var + `resolveOwnerEmail` helper

**Files:**
- Modify: `src/config.ts`
- Modify: `src/server.ts` (add helper near line 59)
- Modify: `tests/setup.ts`
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing test for `resolveOwnerEmail` env fallback**

In `tests/handlers.test.ts`, add a new describe block after the existing `loxo_create_company` tests (around line 365):

```ts
// ─── resolveOwnerEmail (via loxo_create_deal) ───────────────────────────

describe('resolveOwnerEmail', () => {
  it('falls back to LOXO_DEFAULT_OWNER_EMAIL env var', async () => {
    vi.stubEnv('LOXO_DEFAULT_OWNER_EMAIL', 'heather@example.com');
    let capturedBody = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
      capturedBody = opts?.body || '';
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ deal: { id: 1, name: 'TEST - Deal' } })),
      });
    }));
    const result = await callTool(client, 'loxo_create_deal', {
      name: 'TEST - Deal',
      amount: 10000,
      closes_at: '2026-06-01',
      workflow_id: '54622',
      pipeline_stage_id: '100',
    });
    expect(result.isError).toBeFalsy();
    expect(capturedBody).toContain('deal%5Bowner_email%5D=heather%40example.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/handlers.test.ts -t "falls back to LOXO_DEFAULT_OWNER_EMAIL"`
Expected: FAIL — `loxo_create_deal` tool and `resolveOwnerEmail` don't exist yet.

- [ ] **Step 3: Add `LOXO_DEFAULT_OWNER_EMAIL` to config.ts**

In `src/config.ts`, add `LOXO_DEFAULT_OWNER_EMAIL` to the `envSchema` object, after the `LOXO_DEFAULT_OWNER_ID` entry:

```ts
  LOXO_DEFAULT_OWNER_EMAIL: z.string().optional(),
```

- [ ] **Step 4: Add `resolveOwnerEmail` helper to server.ts**

In `src/server.ts`, add this function right after `resolveOwnerId` (after line 63):

```ts
function resolveOwnerEmail(explicitArg: string | undefined): string | undefined {
  if (explicitArg) return explicitArg;
  return process.env.LOXO_DEFAULT_OWNER_EMAIL || undefined;
}
```

- [ ] **Step 5: Update tests/setup.ts**

The spec requires `LOXO_DEFAULT_OWNER_EMAIL` NOT be set by default in tests (empty string = not set). Each test that needs it will use `vi.stubEnv()`. No change needed — `tests/setup.ts` doesn't set it, which is the correct default. Verify this by reading the file; if any future change adds it with a real value, remove it.

- [ ] **Step 6: Verify build compiles**

Run: `npm run build`
Expected: Success (no type errors). The test still fails because `loxo_create_deal` doesn't exist yet — that's expected; it will pass after Task 8.

- [ ] **Step 7: Commit**

```bash
git add src/config.ts src/server.ts tests/handlers.test.ts
git commit -m "feat: add LOXO_DEFAULT_OWNER_EMAIL env var and resolveOwnerEmail helper"
```

---

### Task 3: Modify `loxo_get_activity_types` — add `workflow_id` param

**Files:**
- Modify: `src/server.ts` (tool definition ~line 534, handler ~line 1171)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/handlers.test.ts`, add to the existing `loxo_get_activity_types` describe block (around line 43):

```ts
  it('appends workflow_id as query param when provided', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify([{ id: 100, name: 'Deal Won' }])),
      });
    }));
    const result = await callTool(client, 'loxo_get_activity_types', { workflow_id: '54622' });
    expect(result.isError).toBeFalsy();
    expect(capturedUrl).toContain('workflow_id=54622');
    expect(result.content[0].text).toContain('Deal Won');
  });

  it('omits workflow_id when not provided (backward compat)', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify([{ id: 1, name: 'Call' }])),
      });
    }));
    const result = await callTool(client, 'loxo_get_activity_types', {});
    expect(result.isError).toBeFalsy();
    expect(capturedUrl).not.toContain('workflow_id');
  });

  it('rejects non-numeric workflow_id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
    const result = await callTool(client, 'loxo_get_activity_types', { workflow_id: 'abc' });
    expect(result.isError).toBe(true);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_activity_types"`
Expected: FAIL — `workflow_id` not recognized yet.

- [ ] **Step 3: Update tool definition**

In `src/server.ts`, in the `loxo_get_activity_types` tool definition (around line 534), update the `description` and add `workflow_id` to `properties`:

Update the description to:
```
"Get a list of all available activity types in Loxo (e.g., calls, meetings, interviews). Use this before scheduling or logging activities to find the correct activity_type_id. Pass a deal workflow_id to get deal-specific activity types (e.g. 'Deal Won', 'New Lead') instead of candidate activity types. Example: Call loxo_list_deal_workflows to get the workflow ID, then pass it here."
```

Add to `properties` (after `response_format`):
```json
workflow_id: {
  type: "string",
  description: "Optional: Filter by workflow ID. Pass a deal workflow ID to get deal-specific activity types instead of candidate activity types. Use loxo_list_deal_workflows to find workflow IDs."
}
```

- [ ] **Step 4: Update handler**

In `src/server.ts`, replace the `loxo_get_activity_types` handler case (around line 1171):

```ts
      case "loxo_get_activity_types": {
        const { response_format = 'json', workflow_id } = args as any;
        let endpoint = `/${env.LOXO_AGENCY_SLUG}/activity_types`;
        if (workflow_id) {
          requireNumericId(workflow_id, 'workflow_id');
          endpoint += `?workflow_id=${workflow_id}`;
        }
        const response = await makeRequest(endpoint);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_activity_types"`
Expected: All 4 tests PASS (original + 3 new).

- [ ] **Step 6: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add workflow_id param to loxo_get_activity_types"
```

---

### Task 4: `loxo_list_deal_workflows` tool

**Files:**
- Modify: `src/server.ts` (schema ~line 469, tool def ~line 1157, handler ~line 1841)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing test**

In `tests/handlers.test.ts`, add a new describe block:

```ts
  // ─── loxo_list_deal_workflows ───────────────────────────────────────────

  describe('loxo_list_deal_workflows', () => {
    it('returns array of deal workflows', async () => {
      mockFetch([
        { id: 54622, name: 'Job Leads Pipeline' },
        { id: 70404, name: 'Prospect Client Pipeline' },
      ]);
      const result = await callTool(client, 'loxo_list_deal_workflows', {});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Job Leads Pipeline');
      expect(result.content[0].text).toContain('70404');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_list_deal_workflows"`
Expected: FAIL — `Unknown tool: loxo_list_deal_workflows`.

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after the existing schemas (around line 469, after `UploadResumeSchema`), add:

```ts
const ListDealWorkflowsSchema = z.object({
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

- [ ] **Step 4: Add tool definition**

In `src/server.ts`, in the `ListToolsRequestSchema` handler, add before the closing `]` of the tools array (before line 1161):

```ts
      {
        name: "loxo_list_deal_workflows",
        description: "List all deal workflows (pipelines) with their IDs and names. Use the returned workflow ID with loxo_get_deal_workflow to see pipeline stages, or pass it to loxo_get_activity_types to get deal-specific activity types.",
        inputSchema: {
          type: "object",
          properties: {
            response_format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
            }
          },
          required: [],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
```

- [ ] **Step 5: Add handler**

In `src/server.ts`, in the `CallToolRequestSchema` handler switch, add a new case before the `default` case (before line 1843):

```ts
      case "loxo_list_deal_workflows": {
        const { response_format = 'json' } = ListDealWorkflowsSchema.parse(args);
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/deal_workflows`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }
```

- [ ] **Step 6: Run test**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_list_deal_workflows"`
Expected: PASS.

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_list_deal_workflows tool"
```

---

### Task 5: `loxo_get_deal_workflow` tool

**Files:**
- Modify: `src/server.ts` (schema, tool def, handler)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/handlers.test.ts`, add:

```ts
  // ─── loxo_get_deal_workflow ─────────────────────────────────────────────

  describe('loxo_get_deal_workflow', () => {
    it('returns workflow with pipeline stages', async () => {
      mockFetch({
        id: 54622,
        name: 'Job Leads Pipeline',
        pipeline_stages: [
          { id: 100, name: 'New Lead' },
          { id: 101, name: 'Contacted' },
        ],
      });
      const result = await callTool(client, 'loxo_get_deal_workflow', { id: '54622' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Job Leads Pipeline');
      expect(result.content[0].text).toContain('New Lead');
    });

    it('rejects non-numeric id', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_get_deal_workflow', { id: 'abc' });
      expect(result.isError).toBe(true);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_deal_workflow"`
Expected: FAIL — `Unknown tool`.

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after `ListDealWorkflowsSchema`:

```ts
const GetDealWorkflowSchema = z.object({
  id: z.coerce.string().regex(/^\d+$/, "id must be numeric").describe("Deal workflow ID"),
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

- [ ] **Step 4: Add tool definition**

In the tools array, after `loxo_list_deal_workflows`:

```ts
      {
        name: "loxo_get_deal_workflow",
        description: "Get a single deal workflow including its pipeline stages. Use the returned pipeline_stage_id values when creating deals with loxo_create_deal.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Deal workflow ID"
            },
            response_format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
            }
          },
          required: ["id"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
```

- [ ] **Step 5: Add handler**

In the switch, after `loxo_list_deal_workflows`:

```ts
      case "loxo_get_deal_workflow": {
        const { id, response_format = 'json' } = GetDealWorkflowSchema.parse(args);
        requireNumericId(id, 'id');
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/deal_workflows/${id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_deal_workflow"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_get_deal_workflow tool"
```

---

### Task 6: `loxo_search_deals` tool

**Files:**
- Modify: `src/server.ts` (schema, tool def, handler)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/handlers.test.ts`, add:

```ts
  // ─── loxo_search_deals ──────────────────────────────────────────────────

  describe('loxo_search_deals', () => {
    it('returns deals with pagination structure', async () => {
      mockFetch({
        deals: [{ id: 1, name: 'Acme Corp Deal', amount: 5000 }],
        total_count: 1,
        scroll_id: null,
      });
      const result = await callTool(client, 'loxo_search_deals', { query: 'Acme' });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].name).toBe('Acme Corp Deal');
      expect(parsed.pagination.total_count).toBe(1);
      expect(parsed.pagination.has_more).toBe(false);
    });

    it('forwards owner_emails as repeated query params', async () => {
      let capturedUrl = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ deals: [], total_count: 0, scroll_id: null })),
        });
      }));
      const result = await callTool(client, 'loxo_search_deals', {
        owner_emails: ['alice@example.com', 'bob@example.com'],
      });
      expect(result.isError).toBeFalsy();
      expect(capturedUrl).toContain('owner_emails%5B%5D=alice%40example.com');
      expect(capturedUrl).toContain('owner_emails%5B%5D=bob%40example.com');
    });

    it('forwards query as query param', async () => {
      let capturedUrl = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ deals: [], total_count: 0, scroll_id: null })),
        });
      }));
      const result = await callTool(client, 'loxo_search_deals', { query: 'test deal' });
      expect(result.isError).toBeFalsy();
      expect(capturedUrl).toContain('query=test+deal');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_search_deals"`
Expected: FAIL — `Unknown tool`.

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after `GetDealWorkflowSchema`:

```ts
const SearchDealsSchema = z.object({
  query: z.string().optional().describe("Lucene query string"),
  owner_emails: z.array(z.string().email()).optional().describe("Filter by owner email addresses"),
  scroll_id: z.string().optional().describe("Pagination cursor from previous search"),
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

- [ ] **Step 4: Add tool definition**

In the tools array, after `loxo_get_deal_workflow`:

```ts
      {
        name: "loxo_search_deals",
        description: "Search and list deals with optional Lucene query, owner email filter, and cursor-based pagination. Returns deals with pagination metadata. Use loxo_list_deal_workflows first to understand which pipelines exist.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Lucene query string (optional)"
            },
            owner_emails: {
              type: "array",
              items: { type: "string" },
              description: "Filter by owner email addresses (optional)"
            },
            scroll_id: {
              type: "string",
              description: "Pagination cursor from previous search results"
            },
            response_format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
            }
          },
          required: [],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
```

- [ ] **Step 5: Add handler**

In the switch, after `loxo_get_deal_workflow`:

```ts
      case "loxo_search_deals": {
        const { query, owner_emails, scroll_id, response_format = 'json' } = SearchDealsSchema.parse(args);

        const searchParams = new URLSearchParams();
        if (query) searchParams.append('query', query);
        if (scroll_id) searchParams.append('scroll_id', scroll_id);
        if (owner_emails) {
          for (const email of owner_emails) {
            searchParams.append('owner_emails[]', email);
          }
        }

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/deals?${searchParams.toString()}`
        );

        const deals = apiResponse?.deals || apiResponse || [];
        const toolResponse = {
          results: Array.isArray(deals) ? deals : [],
          pagination: {
            scroll_id: apiResponse?.scroll_id || null,
            has_more: !!(apiResponse?.scroll_id),
            total_count: apiResponse?.total_count || 0,
            returned_count: Array.isArray(deals) ? deals.length : 0,
          },
        };

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return { content: [{ type: "text", text }] };
      }
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_search_deals"`
Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_search_deals tool"
```

---

### Task 7: `loxo_get_deal` tool

**Files:**
- Modify: `src/server.ts` (schema, tool def, handler)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/handlers.test.ts`, add:

```ts
  // ─── loxo_get_deal ──────────────────────────────────────────────────────

  describe('loxo_get_deal', () => {
    it('returns deal object on success', async () => {
      mockFetch({ id: 42, name: 'Acme Corp Deal', amount: 15000, closes_at: '2026-06-01' });
      const result = await callTool(client, 'loxo_get_deal', { id: '42' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Acme Corp Deal');
      expect(result.content[0].text).toContain('15000');
    });

    it('rejects non-numeric id', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_get_deal', { id: 'abc' });
      expect(result.isError).toBe(true);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_deal"`
Expected: FAIL — `Unknown tool`.

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after `SearchDealsSchema`:

```ts
const GetDealSchema = z.object({
  id: z.coerce.string().regex(/^\d+$/, "id must be numeric").describe("Deal ID"),
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

- [ ] **Step 4: Add tool definition**

In the tools array, after `loxo_search_deals`:

```ts
      {
        name: "loxo_get_deal",
        description: "Get full details of a single deal by ID, including name, amount, close date, pipeline stage, and linked company/person/job.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Deal ID"
            },
            response_format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
            }
          },
          required: ["id"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
```

- [ ] **Step 5: Add handler**

In the switch, after `loxo_search_deals`:

```ts
      case "loxo_get_deal": {
        const { id, response_format = 'json' } = GetDealSchema.parse(args);
        requireNumericId(id, 'id');
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/deals/${id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_deal"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_get_deal tool"
```

---

### Task 8: `loxo_create_deal` tool

**Files:**
- Modify: `src/server.ts` (schema, tool def, handler)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/handlers.test.ts`, add:

```ts
  // ─── loxo_create_deal ───────────────────────────────────────────────────

  describe('loxo_create_deal', () => {
    it('POSTs form-encoded deal fields', async () => {
      let capturedUrl = '';
      let capturedMethod = '';
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
        capturedUrl = url;
        capturedMethod = opts?.method || 'GET';
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ deal: { id: 1, name: 'TEST - New Deal' } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_deal', {
        name: 'TEST - New Deal',
        amount: 25000,
        closes_at: '2026-07-01',
        workflow_id: '54622',
        pipeline_stage_id: '100',
        owner_email: 'heather@example.com',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedMethod).toBe('POST');
      expect(capturedUrl).toContain('/test-agency/deals');
      expect(capturedBody).toContain('deal%5Bname%5D=TEST+-+New+Deal');
      expect(capturedBody).toContain('deal%5Bamount%5D=25000');
      expect(capturedBody).toContain('deal%5Bcloses_at%5D=2026-07-01');
      expect(capturedBody).toContain('deal%5Bworkflow_id%5D=54622');
      expect(capturedBody).toContain('deal%5Bpipeline_stage_id%5D=100');
      expect(capturedBody).toContain('deal%5Bowner_email%5D=heather%40example.com');
    });

    it('includes optional company_id, person_id, job_id when provided', async () => {
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ deal: { id: 2 } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_deal', {
        name: 'TEST - Linked Deal',
        amount: 10000,
        closes_at: '2026-08-01',
        workflow_id: '54622',
        pipeline_stage_id: '100',
        owner_email: 'heather@example.com',
        company_id: '500',
        person_id: '42',
        job_id: '99',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('deal%5Bcompany_id%5D=500');
      expect(capturedBody).toContain('deal%5Bperson_id%5D=42');
      expect(capturedBody).toContain('deal%5Bjob_id%5D=99');
    });

    it('explicit owner_email overrides env', async () => {
      vi.stubEnv('LOXO_DEFAULT_OWNER_EMAIL', 'env-default@example.com');
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ deal: { id: 3 } })),
        });
      }));
      const result = await callTool(client, 'loxo_create_deal', {
        name: 'TEST - Override Deal',
        amount: 5000,
        closes_at: '2026-09-01',
        workflow_id: '54622',
        pipeline_stage_id: '100',
        owner_email: 'explicit@example.com',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedBody).toContain('deal%5Bowner_email%5D=explicit%40example.com');
      expect(capturedBody).not.toContain('env-default%40example.com');
    });

    it('errors when neither owner_email arg nor env is set', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_create_deal', {
        name: 'TEST - No Owner',
        amount: 5000,
        closes_at: '2026-09-01',
        workflow_id: '54622',
        pipeline_stage_id: '100',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('owner_email');
    });

    it('rejects missing required field', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_create_deal', {
        amount: 5000,
        closes_at: '2026-09-01',
        workflow_id: '54622',
        pipeline_stage_id: '100',
        owner_email: 'heather@example.com',
      });
      expect(result.isError).toBe(true);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_deal"`
Expected: FAIL — `Unknown tool`.

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after `GetDealSchema`:

```ts
const CreateDealSchema = z.object({
  name: z.string().trim().min(1, "name is required").describe("Deal name (required)"),
  amount: z.number().describe("Deal value/amount (required)"),
  closes_at: z.string().describe("Expected close date, ISO datetime (required)"),
  workflow_id: z.coerce.string().regex(/^\d+$/, "workflow_id must be numeric").describe("Deal workflow/pipeline ID (required). Use loxo_list_deal_workflows to find."),
  pipeline_stage_id: z.coerce.string().regex(/^\d+$/, "pipeline_stage_id must be numeric").describe("Initial pipeline stage ID (required). Use loxo_get_deal_workflow to find stage IDs."),
  owner_email: z.string().email().optional().describe("Owner email. Falls back to LOXO_DEFAULT_OWNER_EMAIL env var."),
  company_id: z.coerce.string().regex(/^\d+$/, "company_id must be numeric").optional().describe("Associated company ID"),
  person_id: z.coerce.string().regex(/^\d+$/, "person_id must be numeric").optional().describe("Associated person/contact ID"),
  job_id: z.coerce.string().regex(/^\d+$/, "job_id must be numeric").optional().describe("Associated job ID"),
});
```

- [ ] **Step 4: Add tool definition**

In the tools array, after `loxo_get_deal`:

```ts
      {
        name: "loxo_create_deal",
        description: "Create a new deal in a pipeline. Requires name, amount, close date, workflow_id, and pipeline_stage_id. Use loxo_list_deal_workflows and loxo_get_deal_workflow to find valid workflow and stage IDs. Owner email falls back to LOXO_DEFAULT_OWNER_EMAIL env var if not provided. Optionally link to a company, person, or job.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Deal name (required)" },
            amount: { type: "number", description: "Deal value/amount (required)" },
            closes_at: { type: "string", description: "Expected close date, ISO datetime (required)" },
            workflow_id: { type: "string", description: "Deal workflow/pipeline ID (required). Use loxo_list_deal_workflows to find." },
            pipeline_stage_id: { type: "string", description: "Initial pipeline stage ID (required). Use loxo_get_deal_workflow to find stage IDs." },
            owner_email: { type: "string", description: "Owner email. Falls back to LOXO_DEFAULT_OWNER_EMAIL env var." },
            company_id: { type: "string", description: "Associated company ID (optional)" },
            person_id: { type: "string", description: "Associated person/contact ID (optional)" },
            job_id: { type: "string", description: "Associated job ID (optional)" },
          },
          required: ["name", "amount", "closes_at", "workflow_id", "pipeline_stage_id"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
```

- [ ] **Step 5: Add handler**

In the switch, after `loxo_get_deal`:

```ts
      case "loxo_create_deal": {
        const { name, amount, closes_at, workflow_id, pipeline_stage_id, owner_email, company_id, person_id, job_id } = CreateDealSchema.parse(args);

        const resolvedEmail = resolveOwnerEmail(owner_email);
        if (!resolvedEmail) {
          return {
            content: [{ type: "text", text: "owner_email is required but was not provided and LOXO_DEFAULT_OWNER_EMAIL is not set. Use loxo_list_users to find valid email addresses." }],
            isError: true,
          };
        }

        const formData = new URLSearchParams();
        formData.append('deal[name]', name);
        formData.append('deal[amount]', amount.toString());
        formData.append('deal[closes_at]', closes_at);
        formData.append('deal[workflow_id]', workflow_id);
        formData.append('deal[pipeline_stage_id]', pipeline_stage_id);
        formData.append('deal[owner_email]', resolvedEmail);
        if (company_id) formData.append('deal[company_id]', company_id);
        if (person_id) formData.append('deal[person_id]', person_id);
        if (job_id) formData.append('deal[job_id]', job_id);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/deals`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
          }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_deal"`
Expected: All 5 tests PASS. Also verify the `resolveOwnerEmail` env fallback test from Task 2 now passes.

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS (including the Task 2 env fallback test).

- [ ] **Step 8: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_create_deal tool"
```

---

### Task 9: `loxo_log_deal_activity` tool

**Files:**
- Modify: `src/server.ts` (schema, tool def, handler)
- Test: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/handlers.test.ts`, add:

```ts
  // ─── loxo_log_deal_activity ─────────────────────────────────────────────

  describe('loxo_log_deal_activity', () => {
    it('POSTs activity_type_id and notes to deal events endpoint', async () => {
      let capturedUrl = '';
      let capturedMethod = '';
      let capturedBody = '';
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
        capturedUrl = url;
        capturedMethod = opts?.method || 'GET';
        capturedBody = opts?.body || '';
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ event: { id: 1 } })),
        });
      }));
      const result = await callTool(client, 'loxo_log_deal_activity', {
        deal_id: '42',
        activity_type_id: '1550104',
        notes: 'Deal closed successfully',
      });
      expect(result.isError).toBeFalsy();
      expect(capturedMethod).toBe('POST');
      expect(capturedUrl).toContain('/test-agency/deals/42/events');
      expect(capturedBody).toContain('activity_type_id=1550104');
      expect(capturedBody).toContain('notes=Deal+closed+successfully');
    });

    it('rejects non-numeric deal_id', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_log_deal_activity', {
        deal_id: 'abc',
        activity_type_id: '1550104',
      });
      expect(result.isError).toBe(true);
    });

    it('rejects missing activity_type_id', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch must not be called')));
      const result = await callTool(client, 'loxo_log_deal_activity', {
        deal_id: '42',
      });
      expect(result.isError).toBe(true);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_log_deal_activity"`
Expected: FAIL — `Unknown tool`.

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after `CreateDealSchema`:

```ts
const LogDealActivitySchema = z.object({
  deal_id: z.coerce.string().regex(/^\d+$/, "deal_id must be numeric").describe("Deal ID"),
  activity_type_id: z.coerce.string().regex(/^\d+$/, "activity_type_id must be numeric").describe("Activity type ID. Use loxo_get_activity_types with the deal's workflow_id to find valid IDs."),
  notes: z.string().optional().describe("Optional notes for this activity"),
});
```

- [ ] **Step 4: Add tool definition**

In the tools array, after `loxo_create_deal`:

```ts
      {
        name: "loxo_log_deal_activity",
        description: "Log an activity or event on a deal (e.g. 'Deal Won', 'Meeting', 'Note'). Use loxo_get_activity_types with the deal's workflow_id to find valid activity_type_id values — deal activity types are different from candidate activity types.",
        inputSchema: {
          type: "object",
          properties: {
            deal_id: { type: "string", description: "Deal ID" },
            activity_type_id: { type: "string", description: "Activity type ID. Use loxo_get_activity_types with workflow_id to find valid IDs." },
            notes: { type: "string", description: "Optional notes for this activity" },
          },
          required: ["deal_id", "activity_type_id"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
```

- [ ] **Step 5: Add handler**

In the switch, after `loxo_create_deal`:

```ts
      case "loxo_log_deal_activity": {
        const { deal_id, activity_type_id, notes } = LogDealActivitySchema.parse(args);
        requireNumericId(deal_id, 'deal_id');

        const formData = new URLSearchParams();
        formData.append('activity_type_id', activity_type_id);
        if (notes) formData.append('notes', notes);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/deals/${deal_id}/events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
          }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_log_deal_activity"`
Expected: All 3 tests PASS.

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_log_deal_activity tool"
```

---

### Task 10: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started/installation.md`
- Create: `docs/reference/deals.md`
- Modify: `docs/reference/activities-tasks.md`

- [ ] **Step 1: Update README.md**

Add `LOXO_DEFAULT_OWNER_EMAIL` to the env var section (after `LOXO_DEFAULT_OWNER_ID`, around line 72):
```
- `LOXO_DEFAULT_OWNER_EMAIL`: (Optional) Default email for deal ownership. Used by `loxo_create_deal` when no `owner_email` arg is provided. Find emails via `loxo_list_users`.
```

Add a new "Deals & BD Pipeline" section in Available Tools (after "Manage Pipeline & Jobs", before "Track Activity & Communication"):
```markdown
### Deals & BD Pipeline

- **`loxo_list_deal_workflows`** — List all deal workflows (pipelines) with IDs and names. Use to discover which pipelines exist before searching or creating deals.
- **`loxo_get_deal_workflow`** — Get a deal workflow's details including pipeline stages. Use to find valid `pipeline_stage_id` values for `loxo_create_deal`.
- **`loxo_search_deals`** — Search deals with optional Lucene query and owner email filter. Uses cursor-based pagination with `scroll_id`.
- **`loxo_get_deal`** — Full deal details including name, amount, close date, pipeline stage, and linked company/person/job.
- **`loxo_create_deal`** — Create a new deal in a pipeline. Requires name, amount, close date, workflow ID, and pipeline stage ID. Owner email falls back to `LOXO_DEFAULT_OWNER_EMAIL`.
- **`loxo_log_deal_activity`** — Log an activity on a deal. Use `loxo_get_activity_types` with the deal's `workflow_id` to find deal-specific activity type IDs.
```

Update the `loxo_get_activity_types` description in the "Track Activity & Communication" section to mention `workflow_id`:
```
- **`loxo_get_activity_types`** — List all activity types and their IDs. Optionally pass a `workflow_id` to get deal-specific activity types instead of candidate types. Call this before logging or scheduling activities.
```

Update the version and tool count in the header paragraph (line 8): change `1.6.0` to `1.7.0` and `28 tools` to `34 tools`.

Update the Architecture section (line 238): change `v1.6.0 — 28 tools` to `v1.7.0 — 34 tools`.

Add to Pagination section (around line 247): add deals to the cursor-based list:
```
- **Cursor-based (`scroll_id`)** — used by candidates, companies, deals, schedule items, and activities.
```

- [ ] **Step 2: Update docs/getting-started/installation.md**

Add `LOXO_DEFAULT_OWNER_EMAIL` to whatever env var documentation exists in this file.

- [ ] **Step 3: Create docs/reference/deals.md**

```markdown
# Deals & BD Pipeline

Tools for managing the deals pipeline — tracking business development opportunities, client relationships, and revenue.

## Workflow

1. **Discover pipelines:** `loxo_list_deal_workflows` — find which deal pipelines exist and their IDs
2. **Explore stages:** `loxo_get_deal_workflow` — get pipeline stage IDs for a specific workflow
3. **Search deals:** `loxo_search_deals` — find existing deals by query or owner
4. **View detail:** `loxo_get_deal` — get full details of a specific deal
5. **Create deals:** `loxo_create_deal` — create a new deal in a pipeline stage
6. **Log activity:** `loxo_log_deal_activity` — record activities against a deal

## Activity types

Deal activity types are **separate from candidate activity types**. To get deal-specific types (e.g. "Deal Won", "New Lead", "Terms Signed"):

1. Get the deal's workflow ID from `loxo_list_deal_workflows`
2. Pass it to `loxo_get_activity_types` with `workflow_id`

Calling `loxo_get_activity_types` without `workflow_id` returns candidate activity types.

## Tools

### loxo_list_deal_workflows

List all deal workflows (pipelines).

**Parameters:** None required. Optional: `response_format`.

### loxo_get_deal_workflow

Get a deal workflow with its pipeline stages.

**Parameters:**
- `id` (required) — deal workflow ID

### loxo_search_deals

Search and list deals.

**Parameters:**
- `query` — Lucene query string
- `owner_emails` — array of owner email addresses to filter by
- `scroll_id` — pagination cursor from previous search

### loxo_get_deal

Get full details of a single deal.

**Parameters:**
- `id` (required) — deal ID

### loxo_create_deal

Create a new deal in a pipeline.

**Parameters:**
- `name` (required) — deal name
- `amount` (required) — deal value
- `closes_at` (required) — expected close date (ISO datetime)
- `workflow_id` (required) — pipeline ID from `loxo_list_deal_workflows`
- `pipeline_stage_id` (required) — stage ID from `loxo_get_deal_workflow`
- `owner_email` — owner's email; falls back to `LOXO_DEFAULT_OWNER_EMAIL` env var
- `company_id` — link to a company
- `person_id` — link to a person/contact
- `job_id` — link to a job

### loxo_log_deal_activity

Log an activity on a deal.

**Parameters:**
- `deal_id` (required) — deal ID
- `activity_type_id` (required) — use `loxo_get_activity_types` with `workflow_id` to find valid IDs
- `notes` — optional notes

## Configuration

Set `LOXO_DEFAULT_OWNER_EMAIL` in your `.env` file to avoid passing `owner_email` on every `loxo_create_deal` call:

```env
LOXO_DEFAULT_OWNER_EMAIL=heather@example.com
```

Find valid emails via `loxo_list_users`.
```

- [ ] **Step 4: Update docs/reference/activities-tasks.md**

Add a note about the `workflow_id` parameter to `loxo_get_activity_types` documentation, explaining that deal activity types require passing the deal's workflow ID, and that the default (no `workflow_id`) returns candidate activity types.

- [ ] **Step 5: Run docs build**

Run: `npm run docs:build`
Expected: Success (no broken links).

- [ ] **Step 6: Commit**

```bash
git add README.md docs/getting-started/installation.md docs/reference/deals.md docs/reference/activities-tasks.md
git commit -m "docs: add deals pipeline documentation"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (warnings from pre-existing `no-explicit-any` are expected).

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Success, no type errors.

- [ ] **Step 4: Verify tool count**

Run: `npx vitest run tests/handlers.test.ts`
Count total test cases — should be ~27+ (17 existing + ~10 new deal tests).

- [ ] **Step 5: Commit any final fixes if needed**

Only if lint/build/test surfaced issues.
