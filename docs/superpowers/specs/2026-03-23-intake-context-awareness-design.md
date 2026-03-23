# Intake Context Awareness — Design Spec

**Date:** 2026-03-23
**Version target:** 1.5.0

## Problem

When Heather uses Claude to prepare client briefing packs, pipeline status updates, or evaluate candidate-role fit, Claude retrieves activity timelines and pipeline data but misses the recruiter's call/intake notes stored in the candidate profile's `description` field. These notes — recorded during mobile calls not captured by Ringover — contain the richest candidate intelligence: motivations, personal circumstances, compensation expectations, and role preferences.

The complete picture of a candidate requires **both**:
- **`description`** — Heather's own call/intake notes (the 90% use case for this field)
- **`activities`** — Ringover call summaries, emails, meetings, logged events

Currently, nothing in the tool descriptions tells Claude that `description` exists or matters, and `loxo_get_candidate_brief` returns the last 5 activities unfiltered — often dominated by pipeline stage moves and automation events that carry no useful content.

## Solution

Two changes working together:

1. **Tool description updates** — guide Claude toward complete candidate context across all workflows
2. **Smarter activity filtering in `loxo_get_candidate_brief`** — filter out pipeline/automation noise, return only intel-rich activities, with pagination support for digging deeper

## 1. Tool Description Updates

### `loxo_get_candidate` (~line 627)

**Current:** "Get complete candidate profile including bio, location, current role, skills, tags, compensation, and embedded lists of jobs/education/emails/phones. Use this for overview..."

**New:** "Get complete candidate profile including bio, location, current role, skills, tags, compensation, and embedded lists of jobs/education/emails/phones. The 'description' field contains the recruiter's call and intake notes — personal circumstances, motivations, compensation expectations, and role preferences. This is often the richest source of candidate intelligence. For a complete picture combining intake notes with recent activity (including Ringover call summaries), use loxo_get_candidate_brief instead. Example: After searching candidates, use their ID here to get full details."

### `loxo_get_candidate_brief` (~line 1002)

**Current:** "Get a complete candidate brief in one call: full profile, all contact details, and 5 most recent activities. Use this as the first step before drafting any outreach — it gives you everything you need to write a personalised message without making multiple API calls. Returns: profile fields, email list, phone list, recent_activities (last 5)."

**New:** "Get a complete candidate brief in one call: full profile (including recruiter intake/call notes in the 'description' field), all contact details, and recent intel-rich activities (calls, emails, notes, interviews — filtered to exclude pipeline moves and automation noise). Use this as the first step whenever you need full candidate context — before drafting outreach, preparing client briefing packs, pipeline status updates, or evaluating candidate-role fit. The combination of intake notes and activity history gives the most complete picture of a candidate. Supports pagination via scroll_id for retrieving older activity when you need to dig deeper (e.g. finding salary expectations from an earlier conversation). Returns: profile fields, email list, phone list, recent_activities (intel-rich only), activity_pagination."

### `loxo_get_candidate_activities` (~line 987)

**Current:** "Get the activity history for a candidate — all calls, emails, meetings, and notes logged against them. Use before drafting outreach to see recent contact history and avoid re-pitching someone just spoken to. Returns most recent activities first. Example: Before emailing a candidate, call this to check if someone already contacted them last week."

**New:** "Get the full unfiltered activity history for a candidate — all calls, emails, meetings, notes, pipeline moves, and automation events. Returns most recent activities first. For a filtered view with only intel-rich activities (excluding pipeline noise), use loxo_get_candidate_brief instead. For the recruiter's own call/intake notes (motivations, personal circumstances, compensation), check the 'description' field via loxo_get_candidate or loxo_get_candidate_brief. Example: Before emailing a candidate, call this to check if someone already contacted them last week."

### `loxo_get_job_pipeline` (~line 1015)

**Current:** "Get all candidates in the pipeline for a specific job, with their current stage. Use for pipeline reviews — see who's at which stage, identify stalled candidates, and plan next actions. Example: 'Show me the pipeline for job 456' returns all candidates and their stage (sourced, screened, interviewing, offer, placed)."

**New:** "Get all candidates in the pipeline for a specific job, with their current stage. Returns candidate IDs and pipeline stages only. For client briefing packs or status updates, follow up with loxo_get_candidate_brief for each candidate to get their intake notes, personal context, and recent activity (including Ringover call summaries). Example: 'Show me the pipeline for job 456' returns all candidates and their stage (sourced, screened, interviewing, offer, placed)."

### `loxo_search_candidates` (~line 570)

Append before the existing "Returns:" line:

"When evaluating candidate fit for a role or preparing recommendations, follow up with loxo_get_candidate_brief for shortlisted candidates to get recruiter intake notes and recent activity context."

## 2. Filtered Activity in `loxo_get_candidate_brief`

### Activity Type Classification

**Intel-rich (INCLUDE)** — activities with meaningful content (reference only; implementation uses the blocklist below, not this allowlist):

| Key | Name | ID |
|-----|------|----|
| `incoming_phone_call` | Incoming Phone Call | 1550063 |
| `outgoing_phone_call` | Outgoing Phone Call | 1550062 |
| `initial_candidate_screening_call` | Initial Candidate Screening Call | 2325358 |
| `client_call` | Client Call | 2229311 |
| `bd_call` | BD Call | 2229312 |
| `sent_email` | Sent Email | 1550064 |
| `responded` | Responded | 1550058 |
| `bd_email` | BD Email | 2125197 |
| `sent_sms` | Sent SMS | 1550059 |
| `received_sms` | Received SMS | 1550061 |
| `left_voicemail` | Left VoiceMail | 1550060 |
| `general_note` | Note Update | 1550051 |
| `interview_note` | Interview Note | 1550053 |
| `meeting_scheduled` | Meeting Scheduled | 1881262 |
| `interview_scheduled` | Interview Scheduled | 2049963 |
| `sent_linkedin_message` | Sent InMail | 1550065 |
| `linkedin_message_sent` | Linkedin Message Sent | 2115529 |
| `scorecard_created` | Scorecard Submitted | 1797374 |
| `client_commented` | Hiring Manager Commented | 1928630 |
| `client_marked_as_maybe` | Hiring manager commented (Maybe) | 1797371 |
| `client_marked_as_no` | Hiring manager commented (No) | 1797372 |
| `client_marked_as_yes` | Hiring manager commented (Yes) | 1797373 |

**Noise (EXCLUDE)** — pipeline state transitions and automation:

| Key | Name | ID |
|-----|------|----|
| `marked_as_maybe` | Marked as Maybe | 1550048 |
| `marked_as_yes` | Marked as Yes | 1550049 |
| `longlisted` | Longlisted | 1550050 |
| `applied` | Applied | 1550054 |
| `identified` | Added to Job | 1550055 |
| `unidentified` | Unsourced | 1550056 |
| `outbound` | Outbound | 1550057 |
| `campaign_task_completed` | Outreach™ Task Completed | 1550066 |
| `campaign_sms_sent` | Outreach™ SMS Sent | 1550067 |
| `campaign_email_sent` | Outreach™ Email Sent | 1550068 |
| `campaign_call_queue` | Outreach™ Added to Call Queue | 1550069 |
| `submitted` | Submitted | 1550070 |
| `scheduling` | Scheduling | 1550071 |
| `consultant_interview` | Consultant Interview | 1550072 |
| `client_interview` | 1st Client Interview | 1550073 |
| `second_client_interview` | 2nd Client Interview | 1550074 |
| `third_client_interview` | 3rd Client Interview | 1550075 |
| `final_client_interview` | Final Client Interview | 1550076 |
| `hold` | Hold | 1550077 |
| `offer` | Offer Extended | 1550078 |
| `hired` | Hired | 1550079 |
| `rejected` | Rejected | 1550080 |
| `rejected_by_client` | Rejected by Client | 1550081 |
| `rejected_by_candidate` | Rejected by Candidate | 1550082 |
| `rejected_by_recruiter` | Rejected by Consultant | 1550083 |
| `ai_sourced` | Loxo AI Sourced | 1550084 |
| `form_filled` | Form Filled | 1550085 |
| `sent_automated_email` | Sent Automated Email | 1550052 |
| `linkedin_connection_request` | Linkedin Connection Request | 2311492 |
| `pitched` | Pitched | 2373096 |
| `updated_by_self_updating_crm_agent` | Updated by Self-updating CRM Agent | 2925520 |

### Implementation Approach

Use a **blocklist** of noise activity type IDs. This is safer than an allowlist — if Loxo adds new activity types in the future, they'll be included by default rather than silently dropped.

Define the noise set as a constant:

```typescript
const NOISE_ACTIVITY_TYPE_IDS = new Set([
  1550048, 1550049, 1550050, 1550054, 1550055, 1550056, 1550057,
  1550066, 1550067, 1550068, 1550069, 1550070, 1550071, 1550072,
  1550073, 1550074, 1550075, 1550076, 1550077, 1550078, 1550079,
  1550080, 1550081, 1550082, 1550083, 1550084, 1550085, 1550052,
  2311492, 2373096, 2925520,
]);
```

### Brief Handler Changes

The `loxo_get_candidate_brief` handler currently:
1. Fetches profile, emails, phones, and activities in parallel via `Promise.allSettled`
2. Slices activities to 5

New behaviour:
1. Same parallel fetch, but activities request uses `per_page=50` to have enough to filter from
2. Filter out noise activity type IDs from the batch
3. **Return all filtered results from the batch** (do not slice further) — this keeps pagination honest since the API's `scroll_id` advances by the full batch size
4. Return `scroll_id` and `has_more` from the API response for pagination
5. Accept optional `scroll_id` param for paging through older activities

**Pagination semantics:** Each page fetches 50 raw activities from the API, filters out noise, and returns however many intel-rich activities survive. If a candidate's recent history is dominated by pipeline moves, a page may return fewer than 10 results — this is acceptable. `has_more: true` tells Claude it can page forward for more. Claude decides when it has enough context.

**No looping:** The handler does NOT loop to fill a minimum result count. One API call per page, filter, return. This keeps latency predictable and implementation simple.

### Input Schema Update

Add to `loxo_get_candidate_brief` input schema (in addition to existing `id` and `response_format`):

```typescript
scroll_id: { type: "string", description: "Pagination cursor for older intel-rich activities." }
```

### Response Shape

```typescript
{
  // ...existing profile, emails, phones fields...
  recent_activities: Activity[],  // filtered, intel-rich only (all that survive from a 50-record API batch)
  activity_pagination: {
    scroll_id: string | null,
    has_more: boolean,
  }
}
```

## 3. README Overhaul

Full rewrite of README.md:
- Keep installation, configuration, and Docker sections as-is
- Reorganise tools around recruiter workflows:
  - **Find & Research Candidates** — search, get-candidate, get-candidate-brief, work history, education, contact details
  - **Manage Pipeline & Jobs** — search jobs, get job, get pipeline, add to pipeline
  - **Track Activity & Communication** — get activities, log activity, schedule activity, today's tasks, activity types
  - **Companies & Reference Data** — search companies, get company details, list users, list skillsets, list source types, list person types
  - **Candidate Management** — create candidate, update candidate, upload resume
- Use correct `loxo_` prefixed tool names throughout
- Add workflow examples for briefing packs, status updates, and candidate matching
- Remove stale "New in v2" section and outdated implementation notes
- Update version references
- Client-facing quality — Heather should be able to read it and understand what the MCP does

## 4. Version & Release

- Bump `package.json` version from `1.4.1` to `1.5.0`
- Tag `v1.5.0` after merge to main

## Testing Strategy

### Filtered activities
- Test that `loxo_get_candidate_brief` excludes noise activity types (pipeline moves, automation) from response
- Test that intel-rich activity types (calls, emails, notes) are included
- Test that when all fetched activities are noise, `recent_activities` is an empty array with appropriate `has_more`

### Pagination
- Test that `scroll_id` is passed through to the API and returned in `activity_pagination`
- Test that `has_more: true` when API returns a `scroll_id`
- Test that `has_more: false` when API returns no `scroll_id` (end of history), even if fewer intel-rich results are returned

### Response shape
- Test that response includes `activity_pagination` object (backward-compatibility: existing `loxo_get_candidate_brief` tests must be updated for the new response shape)
- Test that all filtered results from the batch are returned (no slicing)

### Tool descriptions
- Test that tool cross-references are in place (e.g. `loxo_get_candidate` description mentions `loxo_get_candidate_brief`, `loxo_get_job_pipeline` mentions `loxo_get_candidate_brief`)
- Avoid testing for exact keyword matches which would be brittle against wording changes

### Existing tests
- All existing tests must continue to pass (some may need updating for new response shape)

## Out of Scope

- Enriching pipeline/search responses server-side (Approach B)
- New composite tools (Approach C)
- Changes to other profile fields beyond `description`
- Time-window-based filtering (may revisit if pagination proves insufficient)
