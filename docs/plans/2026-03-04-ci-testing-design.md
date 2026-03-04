# CI/Testing Design

Date: 2026-03-04

## Goal

Add handler-level test coverage, linting, and a GitHub Actions CI workflow that runs on every PR targeting `main`. Tests must run without a live Loxo API (production only, no test instance).

## Constraints

- Project uses `"module": "NodeNext"` (ESM) — Jest is incompatible without significant config
- All existing code stays in `src/index.ts` — no refactoring of handler logic
- No API credentials in CI — all HTTP calls mocked

## Test Framework

**Vitest.** ESM-native, Jest-compatible API, zero config for TypeScript ESM projects.

## Test Structure

```
tests/
  utils.test.ts       — pure helper functions (truncateResponse, formatResponse)
  handlers.test.ts    — all tool handlers via mocked fetch + InMemoryTransport
vitest.config.ts      — minimal config
```

## How Handler Tests Work

Each handler test:
1. Creates a `Server` + `Client` pair via `InMemoryTransport` from `@modelcontextprotocol/sdk/inMemory.js`
2. Stubs `globalThis.fetch` with `vi.fn()` returning a controlled JSON payload
3. Calls the tool via `client.callTool({ name, arguments })`
4. Asserts response content

Every tool gets at minimum:
- Happy path: mock returns valid data, assert response contains expected fields
- Validation error: bad/missing required params, assert `isError: true`

Write tools (`loxo_create_candidate`, `loxo_update_candidate`, `loxo_apply_to_job`) additionally get:
- Empty body guard test for `loxo_update_candidate` (only `id` provided)

## New npm Scripts

```json
"test": "vitest run",
"test:watch": "vitest",
"lint": "eslint src --ext .ts",
"lint:fix": "eslint src --ext .ts --fix"
```

## Linting

ESLint with `@typescript-eslint/recommended`. `no-explicit-any` set to `"warn"` (not error) because the codebase intentionally uses `as any` in handler args destructuring.

`.eslintrc.json`:
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

## GitHub Actions Workflow

`.github/workflows/ci.yml` — triggers on PRs to `main` and pushes to `main`.

Steps: checkout → setup Node 20 → `npm ci` → `npm run lint` → `npm run build` → `npm test`

No secrets required. All API responses mocked in tests.

## New Dependencies

```
devDependencies:
  vitest
  @typescript-eslint/parser
  @typescript-eslint/eslint-plugin
  eslint
```

## Not In Scope

- Code coverage thresholds (can add later)
- Prettier / formatting rules
- E2E tests against live API
