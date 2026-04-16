# Activities & Tasks

Tools for tracking calls, emails, meetings, and other recruiter activities. Log completed work, schedule follow-ups, and review activity history.

## loxo_get_candidate_activities

Full unfiltered activity timeline for a candidate: all calls, emails, meetings, notes, pipeline moves, and automation events, most recent first.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person_id` | string | Yes | The candidate's person ID |
| `activity_type_ids` | string[] | No | Restrict results to activities of these types only. Use `loxo_get_activity_types` to discover IDs. Rejected if empty; each element must be numeric. |
| `per_page` | number | No | Results per page |
| `scroll_id` | string | No | Pagination cursor from a previous request |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example — filtered view

> "Show me only the call activities for candidate 42."

Claude calls `loxo_get_activity_types` to find the call type ID, then calls `loxo_get_candidate_activities` with `person_id: "42"` and `activity_type_ids: ["<call_id>"]`, returning only call-type activities.

### Example — full timeline

> "Show me everything that's happened with candidate 28194"

Claude calls `loxo_get_candidate_activities` with `person_id: "28194"`, returning the full activity timeline -- calls, emails sent, pipeline stage changes, interview notes, and automation events -- most recent first. This is useful for reviewing a candidate's engagement history before a follow-up call.

### Related tools

- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- includes recent activities alongside profile and contact details
- [`loxo_log_activity`](/reference/activities-tasks#loxo_log_activity) -- record a new activity after reviewing the timeline

---

## loxo_log_activity

Record a completed activity (call, email, meeting, interview) against a candidate. Use `loxo_get_activity_types` first to find the right activity type ID.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person_id` | string | No | ID of the person for this activity |
| `job_id` | string | No | ID of the related job |
| `company_id` | string | No | ID of the related company |
| `activity_type_id` | string | Yes | ID of the activity type (from `loxo_get_activity_types`) |
| `notes` | string | No | Notes about the completed activity |

### Example

> "Log a call with Marcus Rivera about the Northvale role -- he's interested but wants to wait until Q3"

Claude looks up the activity type ID for "Call" using `loxo_get_activity_types`, then calls `loxo_log_activity` with Marcus's person ID, the Northvale job ID, the call activity type ID, and notes capturing that he is interested but prefers a Q3 timeline. The activity now appears on his timeline in Loxo.

### Related tools

- [`loxo_get_activity_types`](/reference/activities-tasks#loxo_get_activity_types) -- look up the activity type ID before logging
- [`loxo_schedule_activity`](/reference/activities-tasks#loxo_schedule_activity) -- schedule a future follow-up instead of logging a past event
- [`loxo_get_candidate_activities`](/reference/activities-tasks#loxo_get_candidate_activities) -- verify the activity was logged

---

## loxo_schedule_activity

Create a future activity (call, meeting, interview) for a candidate. The activity will appear on your task list for the scheduled date. Use `loxo_get_activity_types` first to find the right activity type ID.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person_id` | string | No | ID of the person for this activity |
| `job_id` | string | No | ID of the related job |
| `company_id` | string | No | ID of the related company |
| `activity_type_id` | string | Yes | ID of the activity type (from `loxo_get_activity_types`) |
| `created_at` | string | Yes | ISO datetime when the activity should occur |
| `notes` | string | No | Notes about the scheduled activity |

### Example

> "Schedule a follow-up call with Sarah Chen for next Tuesday at 2pm"

Claude looks up the activity type ID for "Call," then calls `loxo_schedule_activity` with Sarah's person ID, the call activity type ID, `created_at: "2026-03-31T14:00:00Z"`, and notes like "Follow up on interview feedback from Northvale." The call now appears on the task list for that date.

### Related tools

- [`loxo_get_activity_types`](/reference/activities-tasks#loxo_get_activity_types) -- look up the activity type ID before scheduling
- [`loxo_log_activity`](/reference/activities-tasks#loxo_log_activity) -- record a completed activity instead of scheduling a future one
- [`loxo_get_todays_tasks`](/reference/activities-tasks#loxo_get_todays_tasks) -- view scheduled activities for a given day

---

## loxo_get_todays_tasks

All scheduled items for today or a date range. Optionally filter by user. Use this to review what needs to happen today or plan ahead for the week.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | number | No | Filter tasks by a specific user ID |
| `start_date` | string | No | Start date (ISO format, e.g. `"2026-03-23"`) |
| `end_date` | string | No | End date (ISO format, e.g. `"2026-03-27"`) |
| `per_page` | number | No | Results per page |
| `scroll_id` | string | No | Pagination cursor from a previous request |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "What's on my schedule for this week?"

Claude calls `loxo_get_todays_tasks` with `start_date: "2026-03-23"` and `end_date: "2026-03-27"`, returning all scheduled calls, meetings, and follow-ups for the week. Claude can then summarize the week's agenda and highlight any high-priority items.

### Related tools

- [`loxo_schedule_activity`](/reference/activities-tasks#loxo_schedule_activity) -- add a new item to the task list
- [`loxo_list_users`](/reference/companies-data#loxo_list_users) -- find a user ID to filter tasks by team member

---

## loxo_get_activity_types

List all activity types and their IDs. Call this before logging or scheduling activities so you use the correct activity type ID.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "What activity types are available in Loxo?"

Claude calls `loxo_get_activity_types`, returning all available types (e.g., Call, Email, Meeting, Interview, Note) with their IDs. These IDs are required when logging or scheduling activities.

### Related tools

- [`loxo_log_activity`](/reference/activities-tasks#loxo_log_activity) -- use the activity type ID to log a completed activity
- [`loxo_schedule_activity`](/reference/activities-tasks#loxo_schedule_activity) -- use the activity type ID to schedule a future activity
