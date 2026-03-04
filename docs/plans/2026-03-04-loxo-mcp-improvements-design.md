# Loxo MCP Server — Improvement Design

Date: 2026-03-04

## Context

This MCP server connects Claude to the Loxo recruitment platform API. The primary user is a full-desk recruiter who sources candidates, manages a job pipeline, and handles client relationships. The goal is to make Claude a genuinely useful daily productivity tool for her workflow.

Current state: 17 tools, all read-heavy. No write operations for candidates. No pipeline management. No composite tools. Complex Lucene search syntax with no abstraction.

## Priorities

1. Better candidate search experience (natural language)
2. Outreach drafting support (candidate brief in one call)
3. Pipeline visibility
4. CV ingestion (Claude parses CV, MCP creates/updates the record)
5. Community / open source housekeeping (open PRs)

## New Tools

### `loxo_create_candidate`

**Endpoint:** `POST /{slug}/people` (multipart/form-data)

**Parameters:**
- `name` (required) — full name
- `email` — primary email
- `phone` — primary phone
- `current_title` — current job title
- `current_company` — current employer
- `location` — city/region
- `person_type_id` — integer; used to flag CV-sourced candidates so they don't appear in active pipeline searches (e.g. "Prospect" type)
- `tags` — comma-separated tag string

**Use case:** Claude parses a CV file, extracts structured data, and calls this tool to create the record. The `person_type_id` acts as the quarantine mechanism so ingested candidates don't pollute active pipelines.

### `loxo_update_candidate`

**Endpoint:** `PATCH /{slug}/people/{id}` (multipart/form-data)

**Parameters:** Same as create, all optional, plus required `id`.

**Use case:** CV is for someone already in the system. Update their record with fresher information.

### `loxo_get_candidate_brief` *(composite)*

**Endpoints (parallel):**
- `GET /{slug}/people/{id}` — full profile
- `GET /{slug}/people/{id}/emails` — email addresses
- `GET /{slug}/people/{id}/phones` — phone numbers
- `GET /{slug}/people/{id}/person_events?per_page=5` — 5 most recent activities

**Returns:** Single structured response combining all four. Ideal before drafting outreach — one tool call instead of four to five.

### `loxo_get_candidate_activities`

**Endpoint:** `GET /{slug}/person_events?person_id={id}`

**Parameters:** `person_id` (required), `per_page`, `scroll_id` for pagination.

**Use case:** Full activity history for a candidate. Prevents re-pitching someone recently spoken to, provides context for drafting personalised follow-ups.

### `loxo_get_job_pipeline`

**Endpoint:** `GET /{slug}/jobs/{id}/job_contacts` (per OAS `job_contacts:index`)

**Parameters:** `job_id` (required), `per_page`, `scroll_id`.

**Returns:** Candidates on the job with their current pipeline stage.

**Use case:** Pipeline visibility — see where all candidates stand on a specific role.

### `loxo_apply_to_job`

**Endpoint:** `POST /{slug}/jobs/{id}/job_contacts` (per OAS `job_contacts:create` / `jobs:apply`)

**Parameters:** `job_id` (required), `person_id` (required), `stage` (optional).

**Use case:** After sourcing a candidate, add them to the pipeline for a specific role.

## Search Experience

No new tool needed. The existing `loxo_search_candidates` tool description already contains Lucene examples. Claude translates natural language to Lucene automatically when the description is good enough. The improvement is in the tool description itself — tighten the examples and add a plain-English preamble so Claude knows to do the translation without being asked.

## Open PRs

### PR #1 — glama.ai badge (merge as-is)
Adds discoverability badge to README. Glama is a legitimate MCP registry. No code changes.

### PR #2 — Smithery config (partial merge)
- **Take:** `smithery.yaml` — enables one-command install via `npx @smithery/cli install`. Lowest-friction on-ramp for non-technical users.
- **Take:** README Smithery install section.
- **Skip:** Their Dockerfile — the repo already has one. Theirs copies `.env` into the image, which would bake credentials into a Docker layer — a security issue for a public repo.

### PR #3 — MseeP.ai security badge (merge as-is)
Adds automated security scan badge. Builds trust for open source users. No code changes.

## What Is Not In Scope

- List management (`person_lists`, `person_list_items`) — useful but not in her top workflows
- Company creation — not needed
- Scorecard / forms — not relevant to her role
- Bulk operations — deferred; can be revisited if needed
- Email sending — handled outside Loxo

## Implementation Order

1. Merge PR #1 and PR #3 (README-only, zero risk)
2. Cherry-pick PR #2 partial (smithery.yaml + README section only)
3. Add `loxo_create_candidate`
4. Add `loxo_update_candidate`
5. Add `loxo_get_candidate_brief` (composite)
6. Add `loxo_get_candidate_activities`
7. Add `loxo_get_job_pipeline`
8. Add `loxo_apply_to_job`
9. Build and verify (`npm run build`)
10. Update README with new tools
