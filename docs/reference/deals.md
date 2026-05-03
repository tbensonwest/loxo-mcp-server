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
LOXO_DEFAULT_OWNER_EMAIL=owner@example.com
```

Find valid emails via `loxo_list_users`.
