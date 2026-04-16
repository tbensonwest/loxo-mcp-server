# Activity Filter, Candidate Owner, Company Creation — Design

**Date:** 2026-04-16
**Target version:** 1.6.0
**Branch:** `feat/activity-owner-company`

## Summary

Three small, cohesive additions to the Loxo MCP server:

1. **Filter activities by type** — optional `activity_type_ids` param on `loxo_get_candidate_activities`, forwarded to the API's native filter.
2. **Candidate owner on create/update** — new optional env var `LOXO_DEFAULT_OWNER_ID`; `loxo_create_candidate` and `loxo_update_candidate` accept an optional `owned_by_id` override and fall back to the env default.
3. **Create company** — new `loxo_create_company` tool wrapping `POST /{agency_slug}/companies` with a single required field, `name`.

All three are fully supported by the Loxo API per `.api/apis/openapi.json`.

## Motivation

The primary user is a full-desk recruiter (wife of the repo owner) operating in a single-user setup. Today's pain points:

- Activity history from `loxo_get_candidate_activities` is noisy and paginated; filtering by type (e.g., "only calls") requires walking all results.
- New candidates are created without an owner, so they don't appear in the recruiter's own views and require a follow-up reassignment click in the Loxo UI.
- There is no way to add a new client company from Claude; the recruiter has to open Loxo to create it, breaking the conversational workflow.

## Design

### Feature 1 — Filter activities by type

**Scope:** `loxo_get_candidate_activities` only. `loxo_get_candidate_brief` keeps its existing client-side noise filter unchanged (its opinionated "intel-rich" default is a separate concern; a future override can be added if needed).

**API:** `GET /{agency_slug}/person_events` accepts repeated `activity_type_ids[]` query parameters.

**Tool change:** add optional `activity_type_ids: string[]` input, validated via Zod as `z.array(z.string()).nonempty().optional()`.

**Behavior:**
- Each ID validated via existing `requireNumericId` helper before URL encoding.
- Zod `.nonempty()` rejects an empty array before any network call (would otherwise filter to nothing).
- Omitting the param reproduces current behavior exactly (backward compatible).
- Multiple IDs produce `...&activity_type_ids[]=1&activity_type_ids[]=2&...`.

### Feature 2 — Candidate owner

**New env var:** `LOXO_DEFAULT_OWNER_ID` (optional, numeric string). Validated at module load in `src/config.ts`. If set but non-numeric, fail fast with a message pointing the user at `loxo_list_users`.

**Tool changes:** `loxo_create_candidate` and `loxo_update_candidate` each gain an optional `owned_by_id: string` input.

**Precedence:**

```
args.owned_by_id   (explicit per-call override)
  ↓  (if absent)
env.LOXO_DEFAULT_OWNER_ID   (configured default)
  ↓  (if absent)
omit `person[owned_by_id]` from form body   (current behavior — backward compatible)
```

Tool descriptions state the precedence explicitly so clients don't double-apply.

**API field:** `person[owned_by_id]` — integer user ID, validated per call via `requireNumericId`.

### Feature 3 — Create company

**New tool:** `loxo_create_company`.

**Input schema:**

```ts
{
  name: z.string().trim().min(1).describe("Company name (required).")
}
```

**Handler:** `POST /{agency_slug}/companies` with `application/x-www-form-urlencoded` body `company[name]=<name>`. Returns the created company object.

**Deferred (not in this spec):**
- Additional fields (url, description, type_id, status_id, owner_email) — follow-up via `loxo_update_company`.
- `loxo_update_company` itself — not required yet; add when the editing pain shows up.

## Architecture

All changes land in `src/server.ts` following existing patterns:

- **Schemas** — two new Zod schemas (`CreateCompanySchema`, extended `CreateCandidateSchema`/`UpdateCandidateSchema`), plus optional `activity_type_ids` on the activities tool.
- **Tool definitions** — one new entry in `ListToolsRequestSchema` handler (create_company); existing entries extended.
- **Handlers** — one new case in `CallToolRequestSchema` switch; existing cases extended.
- **Config** — `src/config.ts` gains one optional numeric env var.

No new modules. No changes to `src/index.ts`.

## Testing (TDD)

All tests use the existing `InMemoryTransport.createLinkedPair` + mocked `globalThis.fetch` infrastructure. No live API calls.

### Feature 1 tests (`tests/handlers.test.ts`)

- `activity_type_ids: ["1","2"]` produces `activity_type_ids[]=1&activity_type_ids[]=2` in the request URL.
- Omitting the param produces no `activity_type_ids[]` in the URL (backward compat).
- Non-numeric element (e.g., `"abc"`) returns an error without calling fetch.
- Empty array returns an error without calling fetch.

### Feature 2 tests (`tests/handlers.test.ts`)

For both `loxo_create_candidate` and `loxo_update_candidate`:

- With `LOXO_DEFAULT_OWNER_ID=42` set and no `owned_by_id` arg → body contains `person[owned_by_id]=42`.
- With env set AND explicit `owned_by_id=99` → body contains `person[owned_by_id]=99` (override wins).
- With env unset and no arg → body contains NO `person[owned_by_id]` (existing tests must continue to pass).
- Non-numeric `owned_by_id` returns an error.

### Feature 2 config test (`tests/utils.test.ts` or new `tests/config.test.ts`)

- `LOXO_DEFAULT_OWNER_ID` unset → config loads successfully; `env.LOXO_DEFAULT_OWNER_ID` is undefined.
- `LOXO_DEFAULT_OWNER_ID="42"` → config loads; value is `"42"`.
- `LOXO_DEFAULT_OWNER_ID="abc"` → config load throws with actionable message.

### Feature 3 tests (`tests/handlers.test.ts`)

- `loxo_create_company` is listed by `list_tools`.
- `{ name: "TEST - Acme" }` produces `POST /{agency_slug}/companies` with body `company[name]=TEST+-+Acme` (URL-encoded).
- Missing `name` is rejected by Zod before fetch is called.
- Whitespace-only `name` rejected by `.trim().min(1)`.

### Test-writing order (TDD)

Red → green → refactor, one feature at a time, smallest vertical slices:

1. Config test for `LOXO_DEFAULT_OWNER_ID` validation → add env var to `src/config.ts`.
2. Create candidate owner tests → add field to create handler.
3. Update candidate owner tests → add field to update handler.
4. Activity filter tests → add param to list handler.
5. Create company tests → add schema, tool def, handler.

`tests/setup.ts` must NOT include `LOXO_DEFAULT_OWNER_ID` in the default stubbed env — otherwise every existing create/update test would start sending an unexpected `person[owned_by_id]` field. Each new owner-related test stubs the env via `vi.stubEnv('LOXO_DEFAULT_OWNER_ID', '42')` within the test (or `beforeEach` in a describe block), with `vi.unstubAllEnvs()` in `afterEach`.

## Error handling

All three features route through the existing `makeRequest<T>` helper, which handles HTTP errors, redacts bodies in stderr logs, and surfaces errors via the global handler. No new error paths.

Validation errors (non-numeric IDs, empty arrays, missing required fields) short-circuit before any network call and return a clear `isError: true` response.

## Docs (updated in the same PR)

| Doc | Change |
|---|---|
| `README.md` | Add docs-site link near the top; add `LOXO_DEFAULT_OWNER_ID` to env var table; add `loxo_create_company` to the tool list; mention `activity_type_ids` filter on activities. |
| `docs/getting-started/installation.md` (or config page) | Document `LOXO_DEFAULT_OWNER_ID` — purpose, how to obtain the ID via `loxo_list_users`, optional. |
| `docs/reference/candidates.md` | Document new `owned_by_id` param on create/update; explain env default and override precedence. |
| `docs/reference/companies-data.md` | Add `loxo_create_company` section. |
| `docs/reference/activities-tasks.md` | Document new `activity_type_ids` param on `loxo_get_candidate_activities`; example showing use with `loxo_get_activity_types`. |
| `docs/guides/adding-candidate.md` | Update workflow to mention automatic owner attachment. |

Docs change lands in the same PR so the release is cohesive.

## Release

- Version bump: `1.5.0` → `1.6.0` (new tool + new public env var = minor bump per semver).
- Follow existing flow: feature branch → PR → merge to main → separate version-bump PR.

## Out of scope (intentionally deferred)

- `loxo_update_company` — no editing need expressed yet.
- Noise-filter override on `loxo_get_candidate_brief` — its opinionated default is still desirable; add override only when the pain surfaces.
- Bulk owner reassignment across existing candidates.
- Owner default for company creation (would require a separate `LOXO_DEFAULT_OWNER_EMAIL` or a user-lookup step; scoped out after discussion).
