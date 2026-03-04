# CI/Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Vitest handler tests (with mocked fetch), ESLint, and a GitHub Actions CI workflow that runs on every PR to main.

**Architecture:** `src/index.ts` is refactored into a `createServer()` factory in `src/server.ts` (exports the server creator + pure helpers) and a minimal `src/index.ts` (just connects the stdio transport). Tests import `createServer()`, pair it with `InMemoryTransport` from the MCP SDK, mock `globalThis.fetch`, and call tools through the MCP Client. No live API calls anywhere in the test suite.

**Tech Stack:** Vitest (ESM-native test runner), `@modelcontextprotocol/sdk` InMemoryTransport, `@typescript-eslint`, GitHub Actions.

---

## Task 1: Install dev dependencies and configure tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `.eslintrc.json`
- Create: `tests/setup.ts`

**Step 1: Install dev dependencies**

```bash
npm install --save-dev vitest @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint
```

Expected: packages added to `devDependencies` in package.json.

**Step 2: Add scripts to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"test": "vitest run",
"test:watch": "vitest",
"lint": "eslint src --ext .ts",
"lint:fix": "eslint src --ext .ts --fix"
```

**Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**Step 4: Create `tests/setup.ts`**

This sets fake env vars before any test module is imported — required because `src/server.ts` calls `validateEnv()` at module load time.

```typescript
// Set fake env vars before any module import attempts to validate them
process.env.LOXO_API_KEY = 'test-api-key';
process.env.LOXO_AGENCY_SLUG = 'test-agency';
process.env.LOXO_DOMAIN = 'app.loxo.co';
```

**Step 5: Create `.eslintrc.json`**

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Step 6: Verify lint runs (no TS files changed yet, just checking config)**

```bash
npm run lint
```

Expected: exits 0 or shows warnings (no errors that would block CI). If there are errors, note them — they'll be addressed in the next task.

**Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .eslintrc.json tests/setup.ts
git commit -m "chore: add vitest, eslint, and CI tooling config"
```

---

## Task 2: Refactor src/index.ts → src/server.ts + minimal src/index.ts

**Files:**
- Create: `src/server.ts`
- Modify: `src/index.ts`

**Context:** Currently all logic (types, schemas, handlers, server instance, transport connection) is in one 1600-line file. Tests need to import the server without starting the stdio transport. This task splits the file: `src/server.ts` gets everything except the transport wiring, and `src/index.ts` becomes 10 lines.

**Step 1: Create `src/server.ts`**

Copy the entire content of `src/index.ts` into `src/server.ts`, then make these changes:

1. **Remove** the `StdioServerTransport` import line (line 2 of the original).
2. **Remove** the `main()` function and the `main().catch(...)` call at the bottom (last ~8 lines).
3. **Add** these exports just before the end of the file (after `server.setRequestHandler(CallToolRequestSchema, ...)`):

```typescript
export { server, truncateResponse, formatResponse };
```

The file should end with those exports — no `main()`, no transport code.

**Step 2: Replace `src/index.ts` with minimal transport wiring**

Overwrite `src/index.ts` with:

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from './server.js';

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Loxo MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Step 3: Build to verify the refactor compiles**

```bash
npm run build
```

Expected: exits 0. If TypeScript errors appear (e.g. missing imports in one file), fix them before proceeding.

**Step 4: Run lint to check for any new issues**

```bash
npm run lint
```

Expected: exits 0, possibly with `no-explicit-any` warnings (those are fine — they're set to `warn` not `error`).

**Step 5: Commit**

```bash
git add src/server.ts src/index.ts
git commit -m "refactor: extract server factory to src/server.ts for testability"
```

---

## Task 3: Write utils tests

**Files:**
- Create: `tests/utils.test.ts`

**Context:** `truncateResponse` and `formatResponse` are pure functions exported from `src/server.ts`. These are the easiest tests to write — no mocking needed.

**Step 1: Create `tests/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { truncateResponse, formatResponse } from '../src/server.js';

describe('truncateResponse', () => {
  it('returns full text when under the limit', () => {
    const input = 'hello world';
    const result = truncateResponse(input);
    expect(result.text).toBe('hello world');
    expect(result.wasTruncated).toBe(false);
  });

  it('truncates text that exceeds the limit', () => {
    const longText = 'a'.repeat(30000);
    const result = truncateResponse(longText);
    expect(result.wasTruncated).toBe(true);
    expect(result.text).toContain('[Response truncated');
    expect(result.text.length).toBeLessThan(30000);
  });

  it('respects a custom limit', () => {
    const result = truncateResponse('hello world', 5);
    expect(result.wasTruncated).toBe(true);
    expect(result.text).toContain('[Response truncated');
  });

  it('returns exact limit length content without truncating', () => {
    const input = 'a'.repeat(25000);
    const result = truncateResponse(input, 25000);
    expect(result.wasTruncated).toBe(false);
  });
});

describe('formatResponse', () => {
  const data = { name: 'Jane', id: '1' };

  it('returns JSON string by default', () => {
    const result = formatResponse(data);
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('returns JSON string when format is json', () => {
    const result = formatResponse(data, 'json');
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('returns markdown code block when format is markdown', () => {
    const result = formatResponse(data, 'markdown');
    expect(result).toContain('```json');
    expect(result).toContain('"name": "Jane"');
    expect(result).toContain('```');
  });
});
```

**Step 2: Run tests**

```bash
npm test
```

Expected: all 8 tests pass. If `truncateResponse` or `formatResponse` aren't exported from `src/server.ts`, the import will fail — go back and add the export.

**Step 3: Commit**

```bash
git add tests/utils.test.ts
git commit -m "test: add utils tests for truncateResponse and formatResponse"
```

---

## Task 4: Write handler tests — read tools

**Files:**
- Create: `tests/handlers.test.ts`

**Context:** Uses `InMemoryTransport` from the MCP SDK to create an in-process server+client pair. `globalThis.fetch` is stubbed so no real HTTP calls are made. Each test: mock the fetch response → call the tool via MCP client → assert response content.

**Important:** The MCP SDK `Server` instance cannot be reconnected once closed. Create a fresh server per test using the `server` singleton from `src/server.ts` — BUT because the server tracks its own connection state, create the `InMemoryTransport` pair fresh per test and use `beforeEach`/`afterEach` to manage lifecycle.

Note: If `InMemoryTransport` import path fails at runtime, check by running:
```bash
node -e "import('@modelcontextprotocol/sdk/inMemory.js').then(m => console.log(Object.keys(m)))"
```
The correct path is `@modelcontextprotocol/sdk/inMemory.js`.

**Step 1: Create `tests/handlers.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { server } from '../src/server.js';

// Helper: stub globalThis.fetch with a JSON response
function mockFetch(data: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
    text: () => Promise.resolve(JSON.stringify(data)),
  }));
}

// Helper: call a tool and return the parsed result
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
      expect(result.content[0].text).toContain('not found');
    });
  });

  // ─── loxo_get_candidate_brief ─────────────────────────────────────────────

  describe('loxo_get_candidate_brief', () => {
    it('returns combined profile, emails, phones, activities', async () => {
      // Promise.all fires 4 requests; stub fetch to return sequentially
      let callCount = 0;
      vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
        callCount++;
        const responses: Record<number, unknown> = {
          1: { id: '42', name: 'Jane Smith' },                             // profile
          2: [{ value: 'jane@example.com' }],                              // emails
          3: [{ value: '+44 7700 900000' }],                               // phones
          4: { person_events: [{ id: 1, notes: 'Called re: role' }] },     // activities
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify(responses[callCount] ?? {})),
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
      expect(result.content[0].text).toContain('Called');
    });
  });

  // ─── loxo_search_jobs ─────────────────────────────────────────────────────

  describe('loxo_search_jobs', () => {
    it('returns job list', async () => {
      mockFetch({ jobs: [{ id: 1, title: 'Senior Engineer' }], total_count: 1 });
      const result = await callTool(client, 'loxo_search_jobs', { query: 'Engineer' });
      expect(result.isError).toBeFalsy();
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
      expect(result.content[0].text).toContain('"job_id": "100"');
    });
  });

  // ─── loxo_search_companies ────────────────────────────────────────────────

  describe('loxo_search_companies', () => {
    it('returns company list', async () => {
      mockFetch({ companies: [{ id: 1, name: 'Acme Corp' }], total_count: 1, scroll_id: null });
      const result = await callTool(client, 'loxo_search_companies', { query: 'Acme' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Acme Corp');
    });
  });
});
```

**Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass. Common failures and fixes:
- `Cannot find module '@modelcontextprotocol/sdk/inMemory.js'` → run `node -e "import('@modelcontextprotocol/sdk/inMemory.js').then(m=>console.log(Object.keys(m)))"` to find the correct path; update the import
- `server.connect() called on already-connected server` → the `server` singleton needs to handle re-connection; look into whether the SDK supports `server.close()` before reconnecting in `afterEach`
- Type errors → add type annotations or `as any` casts where the SDK types are strict

**Step 3: Commit**

```bash
git add tests/handlers.test.ts
git commit -m "test: add handler tests for read tools"
```

---

## Task 5: Write handler tests — write tools

**Files:**
- Modify: `tests/handlers.test.ts`

**Context:** Tests for create, update, apply, and log_activity. Includes the empty-body guard test for `loxo_update_candidate`.

**Step 1: Add write tool tests to `tests/handlers.test.ts`**

Inside the outer `describe('Loxo MCP tool handlers', ...)` block, after the last read tool describe, add:

```typescript
  // ─── loxo_create_candidate ────────────────────────────────────────────────

  describe('loxo_create_candidate', () => {
    it('creates candidate and returns the new record', async () => {
      mockFetch({ id: '99', name: 'TEST - Jane Doe', title: 'Engineer' });
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
      // Zod validation should fire before any fetch call
      const result = await callTool(client, 'loxo_create_candidate', {
        email: 'no-name@example.com',
      });
      expect(result.isError).toBe(true);
    });
  });

  // ─── loxo_update_candidate ────────────────────────────────────────────────

  describe('loxo_update_candidate', () => {
    it('updates candidate and returns updated record', async () => {
      mockFetch({ id: '42', name: 'Jane Smith', title: 'Senior Engineer' });
      const result = await callTool(client, 'loxo_update_candidate', {
        id: '42',
        current_title: 'Senior Engineer',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Senior Engineer');
    });

    it('returns error when only id is provided (empty body guard)', async () => {
      // Should return an error before making any API call
      const result = await callTool(client, 'loxo_update_candidate', { id: '42' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No fields provided to update');
    });
  });

  // ─── loxo_apply_to_job ────────────────────────────────────────────────────

  describe('loxo_apply_to_job', () => {
    it('adds candidate to job pipeline', async () => {
      mockFetch({ id: 1, person_id: '42', job_id: '100' });
      const result = await callTool(client, 'loxo_apply_to_job', {
        job_id: '100',
        person_id: '42',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('"person_id": "42"');
    });

    it('returns error when job_id is missing', async () => {
      const result = await callTool(client, 'loxo_apply_to_job', { person_id: '42' });
      expect(result.isError).toBe(true);
    });
  });

  // ─── loxo_log_activity ────────────────────────────────────────────────────

  describe('loxo_log_activity', () => {
    it('logs activity successfully', async () => {
      mockFetch({ id: 5, activity_type_id: '1', notes: 'Test call logged' });
      const result = await callTool(client, 'loxo_log_activity', {
        person_id: '42',
        activity_type_id: '1',
        notes: 'Test call logged',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Test call logged');
    });
  });
```

**Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass. If the `loxo_apply_to_job` missing-param test fails (i.e. the tool doesn't validate required params), note it — the MCP SDK may return a protocol-level error rather than an `isError` tool response; adjust the assertion accordingly.

**Step 3: Commit**

```bash
git add tests/handlers.test.ts
git commit -m "test: add handler tests for write tools"
```

---

## Task 6: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

**Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
        env:
          LOXO_API_KEY: test-api-key
          LOXO_AGENCY_SLUG: test-agency
          LOXO_DOMAIN: app.loxo.co
```

Note on env vars: the `LOXO_API_KEY` and `LOXO_AGENCY_SLUG` values are fake — they only satisfy `validateEnv()` validation. No real API calls happen because `fetch` is mocked in all tests. These are safe to commit; they're not real credentials.

**Step 3: Build and test locally to confirm everything works before pushing**

```bash
npm run lint && npm run build && npm test
```

Expected: all three commands exit 0.

**Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, build, and test on PRs"
```

---

## Task 7: Final verification and README note

**Files:**
- Modify: `README.md`

**Step 1: Full clean run**

```bash
npm run lint && npm run build && npm test
```

Expected: all exit 0. Fix anything that doesn't.

**Step 2: Add CI badge to README**

In `README.md`, after the existing badges at the top (MseeP.ai and glama badges), add a GitHub Actions CI badge:

```markdown
![CI](https://github.com/tbensonwest/loxo-mcp-server/actions/workflows/ci.yml/badge.svg)
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add CI badge to README"
```

---

## Notes for the Implementer

**ESM import extensions:** The project uses `"module": "NodeNext"`. All relative imports in `src/` use `.js` extensions (TypeScript resolves these to `.ts` at compile time). Vitest handles this transparently — don't change the extension convention.

**Server connection lifecycle:** The MCP `Server` instance maintains connection state. If `beforeEach` fails with "already connected", add `await server.close()` (or equivalent) to `afterEach`. Check the MCP SDK docs for the correct method — it may be `server.disconnect()`.

**The `no-explicit-any` lint warnings:** The codebase uses `args as any` extensively in handler cases. These are warnings not errors, so CI will not fail. Don't mass-suppress them — they're intentional.

**InMemoryTransport import path:** If `@modelcontextprotocol/sdk/inMemory.js` fails, try:
```bash
ls node_modules/@modelcontextprotocol/sdk/dist/ | grep -i mem
```
Then update the import path accordingly.

**CRITICAL:** These tests run against mocked fetch — no real Loxo API calls. Never add real credentials to `.github/workflows/ci.yml` or any test file.
