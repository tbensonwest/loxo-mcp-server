# Companies & Reference Data

Tools for searching companies, viewing company details, and looking up reference data (users, skillsets, source types, person types).

## loxo_search_companies

Search the company database using Lucene queries. Uses cursor-based pagination with scroll_id, similar to candidate search.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search query (Lucene syntax) |
| `scroll_id` | string | No | Cursor for pagination from a previous search |
| `company_type_id` | integer | No | Filter by company type ID |
| `list_id` | integer | No | Filter by list ID |
| `company_global_status_id` | integer | No | Filter by company global status ID |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Find all private equity firms in our database"

Claude calls `loxo_search_companies` with `query: "private equity"`, returning matching companies with their names, types, and IDs. You can then ask Claude to pull full details on any company from the results.

### Related tools

- [`loxo_get_company_details`](/reference/companies-data#loxo_get_company_details) -- full profile for a specific company
- [`loxo_search_candidates`](/reference/candidates#loxo_search_candidates) -- find candidates at a specific company

---

## loxo_get_company_details

Full company profile including description, contacts, relationships, and status. Use this to understand a client or target company before reaching out.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_id` | integer | Yes | The ID of the company |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Tell me about CapEQ Partners -- what do we know about them?"

Claude searches for CapEQ Partners, then calls `loxo_get_company_details` with the company ID, returning the full profile -- description, industry, location, key contacts, and any notes or relationships on file.

### Related tools

- [`loxo_search_companies`](/reference/companies-data#loxo_search_companies) -- find a company when you only have a name or keyword
- [`loxo_search_jobs`](/reference/jobs-pipeline#loxo_search_jobs) -- find jobs associated with this company

---

## loxo_list_users

All users in your Loxo agency with names and emails. Use this to find user IDs for filtering tasks or identifying who owns a candidate or job.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Who are all the recruiters on our team?"

Claude calls `loxo_list_users`, returning every user in the agency with their name, email, and user ID. These IDs can be used to filter tasks by team member.

### Related tools

- [`loxo_get_todays_tasks`](/reference/activities-tasks#loxo_get_todays_tasks) -- filter the task list by a specific user

---

## loxo_list_skillsets

All Skillset and Sector Experience options with their IDs. Use these IDs when updating a candidate's skillsets or sector experience.

### Parameters

No parameters.

### Example

> "What skillsets can I tag candidates with?"

Claude calls `loxo_list_skillsets`, returning all available skillset and sector options with their IDs. These IDs are used with `loxo_update_candidate` to set a candidate's skillsets or sector experience.

### Related tools

- [`loxo_update_candidate`](/reference/candidate-management#loxo_update_candidate) -- use skillset IDs to update a candidate's profile

---

## loxo_list_source_types

All candidate source types with their IDs. Use these IDs when setting or updating how a candidate was sourced.

### Parameters

No parameters.

### Example

> "What source types are available?"

Claude calls `loxo_list_source_types`, returning all source type options (e.g., Referral, LinkedIn, Job Board, Direct Application) with their IDs. Use these IDs with `loxo_update_candidate` to record how a candidate was found.

### Related tools

- [`loxo_update_candidate`](/reference/candidate-management#loxo_update_candidate) -- use source type IDs when updating a candidate

---

## loxo_list_person_types

All person type categories with their IDs. Use these IDs when setting or updating a candidate's person type (e.g., Candidate, Client Contact, Lead).

### Parameters

No parameters.

### Example

> "What person types can I assign?"

Claude calls `loxo_list_person_types`, returning all person type categories with their IDs. Use these IDs with `loxo_update_candidate` to categorize a candidate.

### Related tools

- [`loxo_update_candidate`](/reference/candidate-management#loxo_update_candidate) -- use person type IDs when updating a candidate
- [`loxo_search_candidates`](/reference/candidates#loxo_search_candidates) -- filter searches by person type
