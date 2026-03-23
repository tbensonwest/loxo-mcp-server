# Candidates

Tools for finding and researching candidates in your Loxo database. Start with search to find people, then drill into individual profiles, contact details, work history, and education.

## loxo_search_candidates

Search for candidates using Lucene query syntax. Filter by current title, past employers, skills, tags, location, or any combination. Returns up to 100 results per page including skillsets and tags.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | General Lucene search query |
| `company` | string | No | Current company name to search for |
| `title` | string | No | Current job title to search for |
| `scroll_id` | string | No | Pagination scroll ID from a previous search |
| `per_page` | number | No | Number of results per page |
| `person_global_status_id` | integer | No | Filter by person global status ID |
| `person_type_id` | integer | No | Filter by person type ID |
| `list_id` | integer | No | Filter by person list ID |
| `include_related_agencies` | boolean | No | Include results from related agencies |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Find all candidates who worked at Sterling & Associates"

Claude calls `loxo_search_candidates` with `company: "Sterling & Associates"`, returning matching candidate profiles with names, current roles, and tags. You can then pick any candidate from the results and ask Claude to pull their full brief.

### Related tools

- [`loxo_get_candidate`](/reference/candidates#loxo_get_candidate) -- full profile for a single candidate
- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- profile + contacts + recent activity in one call

---

## loxo_get_candidate

Full candidate profile including bio, current role, skills, tags, compensation, and the recruiter's intake and call notes (in the description field). The description field is often the richest source of candidate intelligence.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Candidate ID |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Pull up the full profile for candidate 28194"

Claude calls `loxo_get_candidate` with `id: "28194"`, returning their complete profile with bio, current role, compensation details, tags, skillsets, and any intake notes stored in the description field.

### Related tools

- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- adds contact details and recent activities on top of the profile
- [`loxo_list_person_job_profiles`](/reference/candidates#loxo_list_person_job_profiles) -- detailed work history beyond just the current role

---

## loxo_get_candidate_brief

The go-to tool when you need full candidate context. Returns the profile (including intake notes), all contact details, and recent intel-rich activities in a single call. This is the tool Claude reaches for most often when preparing briefing packs or answering questions about a specific person.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The candidate's person ID |
| `scroll_id` | string | No | Pagination cursor for older activities |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Give me everything we know about Sarah Chen"

Claude searches for Sarah Chen, then calls `loxo_get_candidate_brief` with her ID. The response includes her profile and intake notes, all email addresses and phone numbers on file, and her recent activity history (calls, emails, submissions, interviews) -- giving Claude enough context to summarize her status, motivations, and last touchpoint.

### Related tools

- [`loxo_search_candidates`](/reference/candidates#loxo_search_candidates) -- find a candidate when you only have a name or keyword
- [`loxo_get_person_job_profile_detail`](/reference/candidates#loxo_get_person_job_profile_detail) -- drill into a specific role in their work history

---

## loxo_get_person_emails

All email addresses on file for a candidate, with type labels (e.g., personal, work).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the person |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "What email addresses do we have for candidate 31502?"

Claude calls `loxo_get_person_emails` with `id: "31502"`, returning all emails on file with their type labels so you know which is personal vs. work.

### Related tools

- [`loxo_get_person_phones`](/reference/candidates#loxo_get_person_phones) -- phone numbers for the same candidate
- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- includes contact details alongside profile and activities

---

## loxo_get_person_phones

All phone numbers on file for a candidate, with type labels (e.g., mobile, office).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the person |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "What's the best number to reach Marcus Rivera?"

Claude looks up Marcus Rivera, then calls `loxo_get_person_phones` with his ID to return all phone numbers on file with their type labels.

### Related tools

- [`loxo_get_person_emails`](/reference/candidates#loxo_get_person_emails) -- email addresses for the same candidate
- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- includes contact details alongside profile and activities

---

## loxo_list_person_job_profiles

Complete work history list for a candidate. Returns all job profile entries including company names, titles, and date ranges.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the person |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Show me the full work history for candidate 28194"

Claude calls `loxo_list_person_job_profiles` with `id: "28194"`, returning every role on their profile -- company names, titles, and tenures -- so you can see their career trajectory at a glance.

### Related tools

- [`loxo_get_person_job_profile_detail`](/reference/candidates#loxo_get_person_job_profile_detail) -- drill into a specific role for full details
- [`loxo_get_candidate`](/reference/candidates#loxo_get_candidate) -- profile overview including current role

---

## loxo_get_person_job_profile_detail

Detailed information about a specific role in a candidate's work history, including full job description, responsibilities, and exact dates.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person_id` | string | Yes | The ID of the person |
| `resource_id` | string | Yes | The ID of the job profile |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Tell me more about her time at Summit Capital"

After listing job profiles, Claude identifies the Summit Capital entry and calls `loxo_get_person_job_profile_detail` with the person ID and that job profile's resource ID, returning the full description of her role, responsibilities, and tenure at Summit Capital.

### Related tools

- [`loxo_list_person_job_profiles`](/reference/candidates#loxo_list_person_job_profiles) -- list all roles first to find the resource ID
- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- broader candidate context

---

## loxo_list_person_education_profiles

Complete education history for a candidate. Returns all education entries including institution names, degrees, and dates.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the person |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Where did candidate 31502 go to school?"

Claude calls `loxo_list_person_education_profiles` with `id: "31502"`, returning all education entries -- universities, degrees, fields of study, and graduation years.

### Related tools

- [`loxo_get_person_education_profile_detail`](/reference/candidates#loxo_get_person_education_profile_detail) -- drill into a specific education entry
- [`loxo_list_person_job_profiles`](/reference/candidates#loxo_list_person_job_profiles) -- work history for the same candidate

---

## loxo_get_person_education_profile_detail

Detailed information about a specific education entry, including degree type, field of study, GPA, and extracurriculars if recorded.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person_id` | string | Yes | The ID of the person |
| `resource_id` | string | Yes | The ID of the education profile |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "What did she study at Wharton?"

After listing education profiles, Claude identifies the Wharton entry and calls `loxo_get_person_education_profile_detail` with the person ID and that education profile's resource ID, returning the degree type, field of study, and any additional details on record.

### Related tools

- [`loxo_list_person_education_profiles`](/reference/candidates#loxo_list_person_education_profiles) -- list all education entries first to find the resource ID
- [`loxo_get_candidate`](/reference/candidates#loxo_get_candidate) -- profile overview with skills and tags
