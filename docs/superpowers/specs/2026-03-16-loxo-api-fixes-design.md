# Loxo MCP Server v1.4 — API Fixes & New Capabilities

> Design spec for fixing broken tools and adding missing features based on
> live API probing conducted 2026-03-16.

**Goal:** Fix `loxo_create_candidate` and `loxo_apply_to_job` which are broken
in production, add resume upload, reference-data tools, and enrichment fields
(tags, skillsets, source type, person type) so Claude can run a full recruiter
workflow end-to-end without manual Loxo UI intervention.

---

## Problem Statement

During a client cowork session (Axis Arbor Analyst shortlisting), Claude:

1. Could not create candidates with email/phone/tags — API returned 422
   "Invalid parameters: [:email_addresses, :phone_numbers, :tag_list]".
2. Could not add candidates to a job pipeline — `loxo_apply_to_job` returned
   400 on every attempt. The endpoint (`POST /jobs/{id}/contacts`) adds
   **company contacts**, not pipeline candidates.
3. Had no way to discover valid `person_type_id` values (Prospect vs Active).
4. Could not set skillsets, source type, or tags on candidates.
5. Could not upload CVs to candidate records.

---

## API Probe Findings (Verified 2026-03-16)

### Create (POST /people)

| Field | Correct format | Notes |
|---|---|---|
| `person[name]` | string | Required |
| `person[title]` | string | Current job title |
| `person[company]` | string | Current employer |
| `person[location]` | string | City/region/country |
| `person[email]` | string | Simple field — NOT `email_addresses[][value]` |
| `person[phone]` | string | Simple field — NOT `phone_numbers[][value]` |

Rejected on create: `email_addresses`, `phone_numbers`, `tag_list`.

### Update (PUT /people/{id})

| Field | Correct format | Notes |
|---|---|---|
| `person[email]` | string | Adds a new email |
| `person[phone]` | string | Adds a new phone |
| `person[all_raw_tags][]` | array (repeated param) | Each tag as separate `person[all_raw_tags][]=x` |
| `person[custom_hierarchy_1][]` | array of hierarchy IDs | Skillset field (e.g. 5704030 = Debt Advisory) |
| `person[source_type_id]` | integer | Source type by ID (e.g. 1206583 = LinkedIn) |
| `person[person_type_id]` | integer (singular!) | `person_type_ids[]` does NOT work |

### Pipeline Management

Adding candidates to a job pipeline is done via **person_events**, not a
dedicated endpoint:

- **Add:** `POST /person_events` with `activity_type_id=1550055` ("Added to
  Job") + `job_id` + `person_id`
- **Remove:** `activity_type_id=1550056` ("Unsourced") + `job_id`
- The current `POST /jobs/{id}/contacts` adds **company contacts** (hiring
  manager, billing, etc.) — a completely different concept.

### File Upload

| Endpoint | Field | Purpose |
|---|---|---|
| `POST /people/{id}/resumes` | `document=@file` (multipart) | CV/resume upload |
| `POST /people/{id}/documents` | `document=@file` (multipart) | General attachments |

### Reference Data Endpoints

| Endpoint | Returns |
|---|---|
| `GET /person_types` | Active Candidate=80073, Prospect Candidate=78122, Active Contact=80074, Prospect Contact=78123 |
| `GET /source_types` | API=1206592, LinkedIn=1206583, Manual=1206590, etc. |
| `GET /dynamic_fields` | All field metadata |
| `GET /dynamic_fields/2602521` | Skillset hierarchy: Debt Advisory=5704030, M&A/Lead Advisory=5690346, Transaction Services=5690347, etc. |
| `GET /dynamic_fields/2602522` | Sector hierarchy: TMT=5690362, Financial Services=5690364, Healthcare=5690358, etc. |
| `GET /job_contact_types` | Company contact types (Main=102375, Hiring Manager=102376, etc.) |

---

## Changes

### 1. Fix `loxo_create_candidate`

**Current (broken):** Uses `person[email_addresses][][value]` and
`person[phone_numbers][][value]` and `person[tag_list]`.

**Fix:** Use `person[email]` and `person[phone]` (simple field names). Remove
tags from create — tags must be set via a follow-up PUT call using
`person[all_raw_tags][]` array format.

Update the Zod schema: remove `tags`, `person_type_id`, and `source_type_id`
from `CreateCandidateSchema` — the API silently ignores or auto-sets all of
these on POST. They must be set via a follow-up PUT call.

### 2. Fix `loxo_apply_to_job` → rename to `loxo_add_to_pipeline`

**Current (broken):** `POST /jobs/{id}/contacts` with bare `person_id` — adds
company contacts, not pipeline candidates.

**Fix:** Reimplement using `POST /person_events` with
`activity_type_id=1550055` ("Added to Job"). The tool already has access to
`loxo_log_activity` which uses the same endpoint — the fix is to make
`loxo_add_to_pipeline` call person_events directly with the correct
activity_type_id.

Add optional `notes` parameter for context (e.g. "Sourced from LinkedIn
applications").

### 3. Fix `loxo_update_candidate`

**Current:** Uses PATCH with `person[email_addresses][][value]` and
`person[tag_list]`.

**Fix:** Switch to PUT. Use `person[email]`, `person[phone]` (simple fields).
Tags via `person[all_raw_tags][]` array format. Add new fields:
`source_type_id`, `skillset_ids` (maps to `person[custom_hierarchy_1][]`),
`sector_ids` (maps to `person[custom_hierarchy_2][]`),
`person_type_id` (singular, via `person[person_type_id]`).

### 4. New tool: `loxo_upload_resume`

`POST /people/{id}/resumes` with multipart form upload. Field name: `document`.
Accepts `person_id`, `file_name`, and `file_content_base64` (inline
base64-encoded content). URL-based fetch was excluded to avoid the server
making arbitrary outbound HTTP requests (security concern).

Primary use case: after creating a candidate from a parsed CV, attach the
original file to their Loxo record.

### 5. New tool: `loxo_list_person_types`

`GET /person_types`. Returns the person type reference data so Claude can
discover valid IDs before creating/updating candidates.

### 6. New tool: `loxo_list_source_types`

`GET /source_types`. Returns source type reference data.

### 7. New tool: `loxo_list_skillsets`

`GET /dynamic_fields/2602521`. Returns the Skillset hierarchy with IDs and
names so Claude can set the correct `skillset_ids` on update.

Also returns the Sector hierarchy from `GET /dynamic_fields/2602522` in the
same response.

### 8. Update tool descriptions

- `loxo_create_candidate`: Document that tags/skillsets/person_type must be set
  via a follow-up `loxo_update_candidate` call after create.
- `loxo_add_to_pipeline`: Explain this uses the "Added to Job" activity event.
- `loxo_update_candidate`: Document all new fields with examples.
- `loxo_log_activity`: Add note that `activity_type_id=1550055` adds to
  pipeline (so users understand the relationship).

---

## Out of Scope

- Resume **download** (read-only, lower priority)
- Person lists management (not needed for current workflow)
- Bulk operations (can be done by calling tools in sequence)
- Custom hierarchy management (create/update hierarchy values)
- Tag auto-creation vs selection (tags appear to be free-text via the API)
