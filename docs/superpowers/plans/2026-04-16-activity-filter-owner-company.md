# Activity Filter, Candidate Owner, Company Creation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1.6.0 of the Loxo MCP server with (1) activity-type filtering on `loxo_get_candidate_activities`, (2) candidate owner support via `LOXO_DEFAULT_OWNER_ID` env var + per-call override, (3) a new `loxo_create_company` tool.

**Architecture:** All code changes land in `src/server.ts` (schemas, tool definitions, handlers) and `src/config.ts` (one new optional env var). Tests use the existing `InMemoryTransport.createLinkedPair` + mocked `globalThis.fetch` pattern — no live API calls. Docs updated in the VitePress site + README.

**Tech Stack:** TypeScript, Zod, `@modelcontextprotocol/sdk`, Vitest, VitePress.

**Spec:** `docs/superpowers/specs/2026-04-16-activity-filter-owner-company-design.md`

**Branch:** `feat/activity-owner-company` (off `main`, spec already committed as `d684560`).

---

## File Structure

**Files created:**
- `tests/config.test.ts` — unit tests for the new env var validation.

**Files modified:**
- `src/config.ts` — add optional `LOXO_DEFAULT_OWNER_ID` to env schema.
- `src/server.ts` — extend two Zod schemas, extend two tool input schemas, extend two handler cases, add one new Zod schema + tool input schema + handler case.
- `tests/handlers.test.ts` — add test blocks for each new behavior.
- `README.md` — docs-site link, env var, tool list, filter param mention.
- `docs/getting-started/installation.md` — document `LOXO_DEFAULT_OWNER_ID`.
- `docs/reference/candidates.md` — document `owned_by_id` param on create/update.
- `docs/reference/companies-data.md` — document new `loxo_create_company`.
- `docs/reference/activities-tasks.md` — document new `activity_type_ids` filter.
- `docs/guides/adding-candidate.md` — mention automatic owner attachment.
- `package.json` — version bump `1.5.0` → `1.6.0`.

**Files unchanged:**
- `src/index.ts`.
- `tests/setup.ts` — MUST NOT add `LOXO_DEFAULT_OWNER_ID` here (would break existing tests).
- `tests/utils.test.ts`.

---

## Task 0: Verify baseline

**Goal:** Confirm tests pass on a clean checkout before making any changes.

- [ ] **Step 0.1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (24 tests across `utils.test.ts` and `handlers.test.ts`).

- [ ] **Step 0.2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: no errors. Warnings about `no-explicit-any` are pre-existing and acceptable.

---

## Task 1: `LOXO_DEFAULT_OWNER_ID` env var

**Goal:** Add an optional numeric-string env var to the config schema. Fail fast with a clear message if set but non-numeric. Absence is fine (backward compatible).

**Files:**
- Create: `tests/config.test.ts`
- Modify: `src/config.ts`

- [x] **Step 1.1: Write the failing config tests**

Create `tests/config.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dotenv so the real .env file does not leak into these tests.
// This keeps the config-validation tests deterministic regardless of
// what the developer has in their local .env.
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

describe('validateEnv — LOXO_DEFAULT_OWNER_ID', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.LOXO_API_KEY = 'test-api-key';
    process.env.LOXO_AGENCY_SLUG = 'test-agency';
    process.env.LOXO_DOMAIN = 'app.loxo.co';
    delete process.env.LOXO_DEFAULT_OWNER_ID;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('accepts absence of LOXO_DEFAULT_OWNER_ID', async () => {
    delete process.env.LOXO_DEFAULT_OWNER_ID;
    const { validateEnv } = await import('../src/config.js');
    const env = validateEnv();
    expect(env.LOXO_DEFAULT_OWNER_ID).toBeUndefined();
  });

  it('accepts a numeric string value', async () => {
    process.env.LOXO_DEFAULT_OWNER_ID = '42';
    const { validateEnv } = await import('../src/config.js');
    const env = validateEnv();
    expect(env.LOXO_DEFAULT_OWNER_ID).toBe('42');
  });

  it('rejects a non-numeric value via process.exit(1)', async () => {
    process.env.LOXO_DEFAULT_OWNER_ID = 'not-a-number';
    const { validateEnv } = await import('../src/config.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateEnv()).toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
```

- [x] **Step 1.2: Run tests to verify they fail**

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — the tests expect a `LOXO_DEFAULT_OWNER_ID` field that doesn't exist in the schema.

- [x] **Step 1.3: Update `src/config.ts` to add the env var**

Replace the contents of `src/config.ts` with:

```typescript
import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
loadEnv({
  path: resolve(process.cwd(), '.env'),
  quiet: true
});

const envSchema = z.object({
  LOXO_API_KEY: z.string().min(1, 'LOXO_API_KEY is required'),
  LOXO_DOMAIN: z.string().default('app.loxo.co'),
  LOXO_AGENCY_SLUG: z.string().min(1, 'LOXO_AGENCY_SLUG is required'),
  LOXO_DEFAULT_OWNER_ID: z
    .string()
    .regex(
      /^\d+$/,
      'LOXO_DEFAULT_OWNER_ID must be a numeric user ID — use loxo_get_users to find yours'
    )
    .optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }

  return result.data;
}
```

- [x] **Step 1.4: Run tests to verify they pass**

Run: `npx vitest run tests/config.test.ts`
Expected: PASS — all three tests green.

- [x] **Step 1.5: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: all tests pass.

- [x] **Step 1.6: Commit**

```bash
git add tests/config.test.ts src/config.ts
git commit -m "feat(config): add optional LOXO_DEFAULT_OWNER_ID env var

Validates as a numeric string; fails fast with actionable message
pointing users at loxo_get_users. Absent = current behavior."
```

---

## Task 2: Candidate owner on create

**Goal:** `loxo_create_candidate` accepts optional `owned_by_id`; falls back to `env.LOXO_DEFAULT_OWNER_ID` when absent; omits the field entirely when neither is set.

**Files:**
- Modify: `src/server.ts` (CreateCandidateSchema near line 405; `loxo_create_candidate` tool def near line 983; handler case near line 1507)
- Modify: `tests/handlers.test.ts` (extend `describe('loxo_create_candidate')` block near line 276)

- [ ] **Step 2.1: Write the failing tests**

Add these `it` blocks inside the existing `describe('loxo_create_candidate', ...)` block in `tests/handlers.test.ts` (after the existing two tests, before the block's closing `});`):

```typescript
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
      vi.unstubAllEnvs();
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
      vi.unstubAllEnvs();
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
      const result = await callTool(client, 'loxo_create_candidate', {
        name: 'TEST - Jane',
        owned_by_id: 'abc',
      });
      expect(result.isError).toBe(true);
    });
```

- [ ] **Step 2.2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_candidate"`
Expected: FAIL — `owned_by_id` is not sent; Zod accepts any string for it.

- [ ] **Step 2.3: Extend `CreateCandidateSchema` in `src/server.ts`**

Find `CreateCandidateSchema` (near line 405) and add the `owned_by_id` field:

```typescript
const CreateCandidateSchema = z.object({
  name: z.string().describe("Full name of the candidate (required)."),
  email: z.string().optional().describe("Primary email address."),
  phone: z.string().optional().describe("Primary phone number."),
  current_title: z.string().optional().describe("Current job title."),
  current_company: z.string().optional().describe("Current employer name."),
  location: z.string().optional().describe("City, region, or country."),
  owned_by_id: z.string().regex(/^\d+$/, "owned_by_id must be numeric").optional().describe("Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var."),
});
```

- [ ] **Step 2.4: Extend the tool's `inputSchema` definition**

Find the `loxo_create_candidate` tool entry in the `ListToolsRequestSchema` handler (near line 983) and add `owned_by_id` to both `properties` and `description`:

Change the `description` to (append one sentence at the end):

```typescript
description: "Create a new candidate record in Loxo with name, contact info, and current role. Source type is auto-set to 'API'. Owner is set from the optional owned_by_id arg, or falls back to the LOXO_DEFAULT_OWNER_ID env var if configured. After creating, use loxo_update_candidate to set tags, skillsets, person_type, source_type, and sector — these fields require a separate PUT call. Example workflow: (1) loxo_create_candidate with name/email/phone/title/company, (2) loxo_update_candidate to add tags and skillset, (3) loxo_add_to_pipeline to add to a job.",
```

Add this property to the `properties` block (after `location`):

```typescript
            owned_by_id: { type: "string", description: "Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var if set." },
```

- [ ] **Step 2.5: Update the handler case for `loxo_create_candidate`**

Find `case "loxo_create_candidate":` (near line 1507) and replace its body with:

```typescript
      case "loxo_create_candidate": {
        const { name, email, phone, current_title, current_company, location, owned_by_id } = CreateCandidateSchema.parse(args);

        const formData = new URLSearchParams();
        formData.append('person[name]', name);
        if (email) formData.append('person[email]', email);
        if (phone) formData.append('person[phone]', phone);
        if (current_title) formData.append('person[title]', current_title);
        if (current_company) formData.append('person[company]', current_company);
        if (location) formData.append('person[location]', location);

        const resolvedOwnerId = owned_by_id ?? env.LOXO_DEFAULT_OWNER_ID;
        if (resolvedOwnerId) {
          formData.append('person[owned_by_id]', resolvedOwnerId);
        }

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/people`,
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

- [ ] **Step 2.6: Run the new tests to verify they pass**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_candidate"`
Expected: PASS — all six tests in the block green (two pre-existing + four new).

- [ ] **Step 2.7: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: all tests pass. (The pre-existing `person[email]` / `person[phone]` test in `loxo_create_candidate` must still pass — `owned_by_id` is only appended when resolved.)

- [ ] **Step 2.8: Commit**

```bash
git add tests/handlers.test.ts src/server.ts
git commit -m "feat(candidate): owner support on create via owned_by_id + env default

Adds optional owned_by_id param to loxo_create_candidate.
Precedence: explicit arg > LOXO_DEFAULT_OWNER_ID env > omit field.
Backward compatible when neither is set."
```

---

## Task 3: Candidate owner on update

**Goal:** Same behavior as Task 2, but for `loxo_update_candidate`. Note: the update handler has a 'No fields provided' guard — `owned_by_id` alone must count as a field.

**Files:**
- Modify: `src/server.ts` (UpdateCandidateSchema near line 414; `loxo_update_candidate` tool def near line 1000; handler case near line 1531)
- Modify: `tests/handlers.test.ts` (extend `describe('loxo_update_candidate')` block near line 314)

- [ ] **Step 3.1: Write the failing tests**

Add these `it` blocks inside the existing `describe('loxo_update_candidate', ...)` block in `tests/handlers.test.ts`:

```typescript
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
      vi.unstubAllEnvs();
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
      vi.unstubAllEnvs();
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
```

- [ ] **Step 3.2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_update_candidate"`
Expected: FAIL — schema doesn't know `owned_by_id`, handler never appends it.

- [ ] **Step 3.3: Extend `UpdateCandidateSchema`**

Find `UpdateCandidateSchema` in `src/server.ts` (near line 414) and add `owned_by_id`:

```typescript
const UpdateCandidateSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be numeric").describe("The candidate's person ID."),
  name: z.string().optional().describe("Full name."),
  email: z.string().optional().describe("Email address to add."),
  phone: z.string().optional().describe("Phone number to add."),
  current_title: z.string().optional().describe("Current job title."),
  current_company: z.string().optional().describe("Current employer name."),
  location: z.string().optional().describe("City, region, or country."),
  tags: z.array(z.string()).optional().describe("Tags to set (replaces existing). E.g. ['cv-import', 'debt-advisory']."),
  skillset_ids: z.array(z.number().int()).optional().describe("Skillset hierarchy IDs. Use loxo_list_skillsets to discover IDs. E.g. [5704030] for Debt Advisory."),
  sector_ids: z.array(z.number().int()).optional().describe("Sector hierarchy IDs. Use loxo_list_skillsets to discover IDs. E.g. [5690364] for Financial Services."),
  person_type_id: z.number().int().optional().describe("Person type ID. 80073=Active Candidate, 78122=Prospect Candidate. Use loxo_list_person_types to discover."),
  source_type_id: z.number().int().optional().describe("Source type ID. E.g. 1206583=LinkedIn, 1206592=API. Use loxo_list_source_types to discover."),
  owned_by_id: z.string().regex(/^\d+$/, "owned_by_id must be numeric").optional().describe("Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var."),
});
```

- [ ] **Step 3.4: Extend the tool's `inputSchema` definition**

Find `loxo_update_candidate` in `ListToolsRequestSchema` (near line 1000). Add `owned_by_id` property after `source_type_id`:

```typescript
            owned_by_id: { type: "string", description: "Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var." },
```

Update the `description` string (append):

```typescript
description: "Update an existing candidate's record in Loxo. Use to set tags, skillsets, sector, person type, source type, and basic profile fields. Tags and skillsets require specific field formats — this tool handles the conversion automatically. Use loxo_list_skillsets and loxo_list_person_types to discover valid IDs before calling. Ownership can be set via owned_by_id (falls back to LOXO_DEFAULT_OWNER_ID env var).",
```

- [ ] **Step 3.5: Update the handler case for `loxo_update_candidate`**

Find `case "loxo_update_candidate":` (near line 1531) and update the destructure and append block. Replace the handler body (everything between `case "loxo_update_candidate": {` and the corresponding closing `}`) with:

```typescript
      case "loxo_update_candidate": {
        const { id, name: updateName, email, phone, current_title, current_company, location, tags, skillset_ids, sector_ids, person_type_id, source_type_id, owned_by_id } = UpdateCandidateSchema.parse(args);

        const formData = new URLSearchParams();
        if (updateName) formData.append('person[name]', updateName);
        if (email) formData.append('person[email]', email);
        if (phone) formData.append('person[phone]', phone);
        if (current_title) formData.append('person[title]', current_title);
        if (current_company) formData.append('person[company]', current_company);
        if (location) formData.append('person[location]', location);
        if (person_type_id) formData.append('person[person_type_id]', person_type_id.toString());
        if (source_type_id) formData.append('person[source_type_id]', source_type_id.toString());
        if (tags) {
          for (const tag of tags) {
            formData.append('person[all_raw_tags][]', tag);
          }
        }
        if (skillset_ids) {
          for (const sid of skillset_ids) {
            formData.append('person[custom_hierarchy_1][]', sid.toString());
          }
        }
        if (sector_ids) {
          for (const sid of sector_ids) {
            formData.append('person[custom_hierarchy_2][]', sid.toString());
          }
        }

        const resolvedOwnerId = owned_by_id ?? env.LOXO_DEFAULT_OWNER_ID;
        if (resolvedOwnerId) {
          formData.append('person[owned_by_id]', resolvedOwnerId);
        }

        if (formData.toString() === '') {
          return {
            content: [{ type: "text", text: "No fields provided to update. Supply at least one optional field alongside id." }],
            isError: true
          };
        }

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/people/${id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
          }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }
```

Note: `owned_by_id` appending happens BEFORE the empty-body guard, so "just set owner" counts as a valid update. The pre-existing `"returns error when only id is provided"` test still passes because no owner is set.

- [ ] **Step 3.6: Run the new tests to verify they pass**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_update_candidate"`
Expected: PASS — all seven tests in the block green (two pre-existing + five new).

- [ ] **Step 3.7: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3.8: Commit**

```bash
git add tests/handlers.test.ts src/server.ts
git commit -m "feat(candidate): owner support on update via owned_by_id + env default

Mirrors loxo_create_candidate behavior. owned_by_id counts toward
the 'no fields provided' guard so 'just reassign owner' is a valid
update call."
```

---

## Task 4: Activity filter by type

**Goal:** `loxo_get_candidate_activities` accepts an optional `activity_type_ids: string[]` and forwards each element as a repeated `activity_type_ids[]` query param. Empty array rejected by Zod. Each ID validated by `requireNumericId`.

**Files:**
- Modify: `src/server.ts` (tool def near line 1023; handler case near line 1579)
- Modify: `tests/handlers.test.ts` (extend `describe('loxo_get_candidate_activities')` block near line 219)

- [ ] **Step 4.1: Write the failing tests**

Add these `it` blocks inside the existing `describe('loxo_get_candidate_activities', ...)` block in `tests/handlers.test.ts`:

```typescript
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
      const result = await callTool(client, 'loxo_get_candidate_activities', {
        person_id: '42',
        activity_type_ids: ['abc'],
      });
      expect(result.isError).toBe(true);
    });

    it('rejects empty activity_type_ids array', async () => {
      const result = await callTool(client, 'loxo_get_candidate_activities', {
        person_id: '42',
        activity_type_ids: [],
      });
      expect(result.isError).toBe(true);
    });
```

- [ ] **Step 4.2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_candidate_activities"`
Expected: FAIL — handler ignores `activity_type_ids`; invalid inputs don't error.

- [ ] **Step 4.3: Add a Zod schema for the activities filter**

Add this near the other activity-related Zod schemas in `src/server.ts` (for example right after `PersonEventSchema`, around line 360):

```typescript
const GetCandidateActivitiesSchema = z.object({
  person_id: z.string().regex(/^\d+$/, "person_id must be numeric"),
  per_page: z.number().int().positive().optional(),
  scroll_id: z.string().optional(),
  response_format: z.enum(['json', 'markdown']).optional(),
  activity_type_ids: z
    .array(z.string().regex(/^\d+$/, "activity_type_ids[] must all be numeric"))
    .nonempty("activity_type_ids cannot be an empty array")
    .optional()
    .describe("Filter to only these activity types. Use loxo_get_activity_types to discover IDs."),
});
```

- [ ] **Step 4.4: Extend the tool's `inputSchema` definition**

Find `loxo_get_candidate_activities` in `ListToolsRequestSchema` (near line 1023). Add the `activity_type_ids` property to `properties`:

```typescript
            activity_type_ids: {
              type: "array",
              items: { type: "string" },
              description: "Optional filter to only specific activity types (e.g., only calls or only emails). Use loxo_get_activity_types first to discover IDs.",
            },
```

Update the `description` string (append one sentence):

```typescript
description: "Get the full unfiltered activity history for a candidate — all calls, emails, meetings, notes, pipeline moves, and automation events. Returns most recent activities first. Optionally filter by activity_type_ids (use loxo_get_activity_types to discover IDs). For a filtered view with only intel-rich activities (excluding pipeline noise), use loxo_get_candidate_brief instead. For the recruiter's own call/intake notes (motivations, personal circumstances, compensation), check the 'description' field via loxo_get_candidate or loxo_get_candidate_brief. Example: Before emailing a candidate, call this to check if someone already contacted them last week.",
```

- [ ] **Step 4.5: Update the handler case**

Find `case "loxo_get_candidate_activities":` (near line 1579) and replace its body with:

```typescript
      case "loxo_get_candidate_activities": {
        const { person_id, per_page, scroll_id, response_format = 'json', activity_type_ids } = GetCandidateActivitiesSchema.parse(args);

        const params = new URLSearchParams();
        params.append('person_id', person_id);
        if (per_page) params.append('per_page', per_page.toString());
        if (scroll_id) params.append('scroll_id', scroll_id);
        if (activity_type_ids) {
          for (const id of activity_type_ids) {
            params.append('activity_type_ids[]', id);
          }
        }

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/person_events?${params.toString()}`
        );

        const items = apiResponse?.person_events || apiResponse?.events || apiResponse || [];
        const toolResponse = {
          results: items,
          pagination: {
            scroll_id: apiResponse?.scroll_id || null,
            has_more: !!(apiResponse?.scroll_id),
            total_count: apiResponse?.total_count || 0,
            returned_count: Array.isArray(items) ? items.length : 0,
          },
        };

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return { content: [{ type: "text", text }] };
      }
```

- [ ] **Step 4.6: Run the new tests to verify they pass**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_get_candidate_activities"`
Expected: PASS — all five tests in the block green (one pre-existing + four new).

- [ ] **Step 4.7: Run the full suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4.8: Commit**

```bash
git add tests/handlers.test.ts src/server.ts
git commit -m "feat(activities): filter by activity_type_ids on loxo_get_candidate_activities

Forwards each ID as activity_type_ids[]=N query param to the API.
Empty array and non-numeric elements rejected by Zod.
Omitting the param preserves current behavior."
```

---

## Task 5: `loxo_create_company` tool

**Goal:** New tool that POSTs to `/{agency_slug}/companies` with `company[name]=<name>`. Only the `name` field is accepted; Zod trims and requires non-empty.

**Files:**
- Modify: `src/server.ts` (new schema near line 410; new tool def in `ListToolsRequestSchema`; new handler case)
- Modify: `tests/handlers.test.ts` (new `describe` block)

- [ ] **Step 5.1: Write the failing tests**

Add a new `describe` block in `tests/handlers.test.ts`, after the existing `describe('loxo_search_companies', ...)` block:

```typescript
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
      const result = await callTool(client, 'loxo_create_company', {});
      expect(result.isError).toBe(true);
    });

    it('rejects whitespace-only name', async () => {
      const result = await callTool(client, 'loxo_create_company', { name: '   ' });
      expect(result.isError).toBe(true);
    });
  });
```

- [ ] **Step 5.2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_company"`
Expected: FAIL — tool doesn't exist; all four tests fail.

- [ ] **Step 5.3: Add `CreateCompanySchema`**

Add near the other company schemas in `src/server.ts` (for example right after `GetCompanyDetailsSchema` around line 390):

```typescript
const CreateCompanySchema = z.object({
  name: z.string().trim().min(1, "name is required").describe("Company name (required)."),
});
```

- [ ] **Step 5.4: Add the tool definition**

In `ListToolsRequestSchema` handler, add a new entry immediately after the `loxo_search_companies` entry (adjust location as needed — place it near other company tools for readability):

```typescript
      {
        name: "loxo_create_company",
        description: "Create a new company (client/target account) record in Loxo. Currently only the name is accepted; additional fields (url, description, status) should be edited in the Loxo UI for now. Use after discovering a new client or target account during a conversation. Example: 'Add Acme Corp as a new client' → call this with name='Acme Corp'.",
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Company name (required)." },
          },
          required: ["name"],
        },
      },
```

- [ ] **Step 5.5: Add the handler case**

In the `CallToolRequestSchema` switch, add a new case (place it near the other write tools, e.g., right after `case "loxo_update_candidate":` block):

```typescript
      case "loxo_create_company": {
        const { name } = CreateCompanySchema.parse(args);

        const formData = new URLSearchParams();
        formData.append('company[name]', name);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/companies`,
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

- [ ] **Step 5.6: Run the new tests**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_company"`
Expected: PASS — all four tests green.

- [ ] **Step 5.7: Run the full suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5.8: Commit**

```bash
git add tests/handlers.test.ts src/server.ts
git commit -m "feat(company): add loxo_create_company tool (name-only)

POSTs company[name]=... to /{agency_slug}/companies.
Additional fields and loxo_update_company deferred — add when
recruiter workflow needs them."
```

---

## Task 6: Lint, build, end-to-end suite

**Goal:** Ensure everything compiles, lints, and passes before touching docs.

- [ ] **Step 6.1: Lint**

Run: `npm run lint`
Expected: no errors. Existing `no-explicit-any` warnings are fine.

- [ ] **Step 6.2: Build**

Run: `npm run build`
Expected: clean compile to `build/`.

- [ ] **Step 6.3: Full test suite**

Run: `npm test`
Expected: all tests pass. Count is original + 17 new tests (3 config + 4 create-candidate + 5 update-candidate + 4 activities + 4 create-company = 20; verify during execution in case of tweaks).

If any task's tests broke another task's tests, fix before moving on.

---

## Task 7: README updates

**Goal:** Add docs-site link, document new env var and tool, mention new filter param.

**Files:**
- Modify: `README.md`

- [ ] **Step 7.1: Add the docs-site link near the top**

Open `README.md`. Locate the project title / tagline at the top. Immediately after it, add a documentation line (adapt wording to match existing tone):

```markdown
**📚 Documentation:** https://tbensonwest.github.io/loxo-mcp-server/
```

- [ ] **Step 7.2: Add `LOXO_DEFAULT_OWNER_ID` to the env var table**

Locate the environment-variables section (search for `LOXO_API_KEY`). Add a new row to the table (or list) mirroring the existing format:

```markdown
| `LOXO_DEFAULT_OWNER_ID` | No | Default Loxo user ID to set as `owned_by_id` on candidates created or updated via this server. Find your ID via `loxo_get_users`. |
```

- [ ] **Step 7.3: Add `loxo_create_company` to the tool list**

Locate the tools list / capabilities section. Add `loxo_create_company` with a one-line description, e.g.:

```markdown
- `loxo_create_company` — Create a new company (client/target account). Currently accepts only `name`.
```

- [ ] **Step 7.4: Mention the activity_type_ids filter**

If `loxo_get_candidate_activities` is listed in the README, update its blurb to mention the new optional filter:

```markdown
- `loxo_get_candidate_activities` — Full activity history for a candidate. Optionally filter by `activity_type_ids` (use `loxo_get_activity_types` to discover IDs).
```

- [ ] **Step 7.5: Commit**

```bash
git add README.md
git commit -m "docs(readme): link docs site, document v1.6.0 additions

Adds link to the VitePress docs site, LOXO_DEFAULT_OWNER_ID
env var row, loxo_create_company tool entry, and the new
activity_type_ids filter mention."
```

---

## Task 8: VitePress reference & guide updates

**Goal:** Update the in-site reference pages and the adding-candidate guide to reflect the new capabilities.

**Files:**
- Modify: `docs/getting-started/installation.md`
- Modify: `docs/reference/candidates.md`
- Modify: `docs/reference/companies-data.md`
- Modify: `docs/reference/activities-tasks.md`
- Modify: `docs/guides/adding-candidate.md`

- [ ] **Step 8.1: `docs/getting-started/installation.md` — document `LOXO_DEFAULT_OWNER_ID`**

Find the env-var / configuration section. Add a subsection or table row:

```markdown
### `LOXO_DEFAULT_OWNER_ID` (optional)

A Loxo user ID (integer, as a string). When set, every candidate created or updated via `loxo_create_candidate` / `loxo_update_candidate` will have this user assigned as `owned_by_id` — unless the call explicitly passes its own `owned_by_id` override.

**How to find your user ID:** ask Claude to run `loxo_get_users` and look up your name.

**If not set:** candidates are created without an owner (existing behaviour).
```

- [ ] **Step 8.2: `docs/reference/candidates.md` — document `owned_by_id`**

In the sections for `loxo_create_candidate` and `loxo_update_candidate`, add a new input row / paragraph:

```markdown
- **`owned_by_id`** *(string, optional)* — Loxo user ID to set as record owner. If omitted, falls back to the `LOXO_DEFAULT_OWNER_ID` env var (if configured). If neither is set, the record is created without an owner.
```

Add a short "Ownership precedence" note:

```markdown
> **Ownership precedence:** explicit `owned_by_id` arg wins over the `LOXO_DEFAULT_OWNER_ID` env var, which wins over no owner at all.
```

- [ ] **Step 8.3: `docs/reference/companies-data.md` — add `loxo_create_company`**

Add a new section mirroring the format of other tool references:

```markdown
## `loxo_create_company`

Create a new company record (client or target account).

**Inputs:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | yes | Company name. Trimmed; must be non-empty. |

**Returns:** the created company record as returned by the Loxo API.

**Notes:**

- Only the `name` field is accepted right now. Additional fields (url, description, company type, status) should be edited in the Loxo UI until a `loxo_update_company` tool is added.
- The tool always sends the body as `application/x-www-form-urlencoded`: `company[name]=<name>`.

**Example (conversational):**

> "Add Acme Corp as a new client."

Claude calls `loxo_create_company` with `name="Acme Corp"`.
```

- [ ] **Step 8.4: `docs/reference/activities-tasks.md` — document `activity_type_ids`**

In the `loxo_get_candidate_activities` section, add or extend the inputs table/list:

```markdown
- **`activity_type_ids`** *(string[], optional)* — Restrict results to activities of these types only. Use `loxo_get_activity_types` to discover IDs. Rejected if empty. Each element must be numeric.

**Example:** "Show me only the call activities for candidate 42."

Claude calls `loxo_get_activity_types` to find the call type ID, then calls `loxo_get_candidate_activities` with `person_id="42"` and `activity_type_ids=["<call_id>"]`.
```

- [ ] **Step 8.5: `docs/guides/adding-candidate.md` — mention automatic owner attachment**

Add a short note in the workflow section (adapt wording to existing tone):

```markdown
> **Automatic owner assignment:** If `LOXO_DEFAULT_OWNER_ID` is configured in the server environment, newly-created candidates are automatically assigned to that Loxo user (typically you). You won't need a follow-up reassignment step. Override on a per-call basis by passing `owned_by_id` explicitly.
```

- [ ] **Step 8.6: Build the docs site locally to verify Markdown renders**

Run: `npm run docs:build`
Expected: VitePress builds successfully, no dead-link warnings for the pages you edited.

- [ ] **Step 8.7: Commit**

```bash
git add docs/
git commit -m "docs(site): document v1.6.0 additions

- installation: document LOXO_DEFAULT_OWNER_ID env var
- reference/candidates: document owned_by_id arg + precedence
- reference/companies-data: add loxo_create_company section
- reference/activities-tasks: document activity_type_ids filter
- guides/adding-candidate: mention automatic owner attachment"
```

---

## Task 9: Version bump

**Goal:** Bump to v1.6.0 in a dedicated commit for a clean release trail.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (regenerated)

- [ ] **Step 9.1: Bump the version**

Run: `npm version minor --no-git-tag-version`
Expected: `package.json` version changes from `1.5.0` to `1.6.0`; `package-lock.json` updates accordingly. No git tag created (handled by release process).

- [ ] **Step 9.2: Verify**

Run: `grep '"version"' package.json`
Expected: `"version": "1.6.0",`

- [ ] **Step 9.3: Run full suite one more time**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 9.4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: bump version to 1.6.0

Activity type filter, candidate owner support, company creation."
```

---

## Task 10: Push and open PR

**Goal:** Push the branch and open a PR against `main`.

- [ ] **Step 10.1: Push**

Run: `git push -u origin feat/activity-owner-company`
Expected: branch pushed successfully.

- [ ] **Step 10.2: Open PR**

Run:

```bash
gh pr create --title "feat: activity filter, candidate owner, company creation (v1.6.0)" --body "$(cat <<'EOF'
## Summary
- Add optional \`activity_type_ids\` filter to \`loxo_get_candidate_activities\` — forwards to the Loxo API's native filter.
- Add \`LOXO_DEFAULT_OWNER_ID\` env var + optional per-call \`owned_by_id\` override on \`loxo_create_candidate\` and \`loxo_update_candidate\`.
- Add \`loxo_create_company\` tool (name-only; update tool deferred).
- Docs updates (README, VitePress reference + guide).
- Version bump 1.5.0 → 1.6.0.

## Spec & plan
- Spec: \`docs/superpowers/specs/2026-04-16-activity-filter-owner-company-design.md\`
- Plan: \`docs/superpowers/plans/2026-04-16-activity-filter-owner-company.md\`

## Test plan
- [x] CI: lint + build + full test suite (vitest)
- [x] New unit test file \`tests/config.test.ts\` for env var validation
- [x] New handler tests for each behavior (default owner, explicit override, omission, invalid input, filter forwarding, empty/invalid array, create_company happy path and validation)
- [ ] Smoke test manually in production Loxo once merged (create a TEST candidate, verify owner; create a TEST company, verify it appears; filter activities on an existing candidate)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

---

## Self-review checklist

Before marking the plan as done, verify:

1. **Spec coverage:**
   - Feature 1 (activity filter) → Task 4 ✓
   - Feature 2 (candidate owner create) → Task 2 ✓
   - Feature 2 (candidate owner update) → Task 3 ✓
   - Feature 3 (create company) → Task 5 ✓
   - New env var → Task 1 ✓
   - Config test coverage → Task 1 ✓
   - Docs updates → Tasks 7 & 8 ✓
   - Version bump → Task 9 ✓
   - PR → Task 10 ✓

2. **Placeholder scan:** No TBDs, no "add appropriate error handling", no "similar to Task N" shortcuts — each task has its full code.

3. **Type consistency:** `owned_by_id` (string, numeric-regex) used consistently in `CreateCandidateSchema`, `UpdateCandidateSchema`, tool defs, handler destructures, and tests. `activity_type_ids` (string[]) consistent across schema, tool def, handler, tests. `name` field on `CreateCompanySchema` is `.trim().min(1)` consistently.

4. **Naming:** `LOXO_DEFAULT_OWNER_ID` used everywhere — env var, config, handlers, docs. No drift to `DEFAULT_OWNER_ID` or similar.

5. **Backward compatibility:** Every existing test continues to pass because owner/filter fields are only appended when set. The empty-body guard in `loxo_update_candidate` still fires when no fields (including owner) are set.
