# Jobs & Pipeline

Tools for searching jobs, viewing job details, and managing candidate pipelines. Use these to find open roles, review requirements and compensation, see who is already on a job, and add new candidates to a pipeline.

## loxo_search_jobs

Search open roles using Lucene queries. Uses page-based pagination (unlike candidate search, which uses scroll IDs).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search query (Lucene syntax) |
| `page` | number | No | Page number (starting at 1) |
| `per_page` | number | No | Results per page |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "What open roles do we have for VP-level finance positions?"

Claude calls `loxo_search_jobs` with `query: "VP Finance"`, returning matching jobs with their titles, companies, statuses, and IDs. You can then ask Claude to pull full details or check the pipeline on any of the results.

### Related tools

- [`loxo_get_job`](/reference/jobs-pipeline#loxo_get_job) -- full details on a specific job
- [`loxo_get_job_pipeline`](/reference/jobs-pipeline#loxo_get_job_pipeline) -- see who is already on the role

---

## loxo_get_job

Full job details including description, requirements, compensation, status, and hiring team. Use this when you need to understand what a role is looking for before matching candidates.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Job ID |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Show me the full details for the Northvale VP Finance role"

Claude searches for the job, then calls `loxo_get_job` with its ID, returning the complete job spec -- description, requirements, compensation range, location, status, and the assigned recruiter. This gives Claude the context it needs to evaluate whether a candidate is a good fit.

### Related tools

- [`loxo_search_jobs`](/reference/jobs-pipeline#loxo_search_jobs) -- find a job when you only have a keyword
- [`loxo_get_job_pipeline`](/reference/jobs-pipeline#loxo_get_job_pipeline) -- see candidates already on this job
- [`loxo_search_candidates`](/reference/candidates#loxo_search_candidates) -- find candidates who might fit the role

---

## loxo_get_job_pipeline

All candidates currently on a job with their pipeline stage (e.g., Sourced, Screened, Interviewing, Offer). Essential for preparing briefing packs and understanding where each candidate stands.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | The job ID |
| `per_page` | number | No | Results per page |
| `scroll_id` | string | No | Pagination cursor for large pipelines |
| `response_format` | string | No | `"json"` or `"markdown"` |

### Example

> "Who's on the pipeline for the Northvale role and what stage are they at?"

Claude looks up the job, then calls `loxo_get_job_pipeline` with the job ID. The response lists every candidate on the role along with their current pipeline stage, letting Claude summarize how many candidates are at each stage and who is furthest along.

### Related tools

- [`loxo_get_candidate_brief`](/reference/candidates#loxo_get_candidate_brief) -- deep dive on any candidate from the pipeline
- [`loxo_get_job`](/reference/jobs-pipeline#loxo_get_job) -- job details to understand what the role requires
- [`loxo_add_to_pipeline`](/reference/jobs-pipeline#loxo_add_to_pipeline) -- add a new candidate to this job

---

## loxo_add_to_pipeline

Add a candidate to a job's pipeline. This is a write operation -- the candidate will appear on the job in Loxo after this call.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | The job ID |
| `person_id` | string | Yes | The candidate's person ID |
| `notes` | string | No | Notes about why the candidate was added |

### Example

> "Add Sarah Chen to the Northvale VP Finance pipeline"

Claude looks up Sarah Chen and the Northvale job, then calls `loxo_add_to_pipeline` with `job_id` and `person_id`, along with notes like "Strong PE fund accounting background from Summit Capital. Client specifically asked about this experience." The candidate now appears on the job's pipeline in Loxo.

### Related tools

- [`loxo_search_candidates`](/reference/candidates#loxo_search_candidates) -- find the candidate to add
- [`loxo_search_jobs`](/reference/jobs-pipeline#loxo_search_jobs) -- find the job to add them to
- [`loxo_get_job_pipeline`](/reference/jobs-pipeline#loxo_get_job_pipeline) -- verify the candidate was added
