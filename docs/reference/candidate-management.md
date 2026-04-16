# Candidate Management

Tools for creating and updating candidate records and uploading resumes.

## loxo_create_candidate

Create a new candidate record with name, contact info, and current role. The candidate will be immediately available in Loxo after creation.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | No | Primary email address |
| `phone` | string | No | Primary phone number |
| `current_title` | string | No | Current job title |
| `current_company` | string | No | Current employer |
| `location` | string | No | City, region, or country |
| `owned_by_id` | string | No | Loxo user ID to set as record owner. If omitted, falls back to the `LOXO_DEFAULT_OWNER_ID` env var (if configured). If neither is set, the record is created without an owner. |

> **Ownership precedence:** explicit `owned_by_id` arg wins over the `LOXO_DEFAULT_OWNER_ID` env var, which wins over no owner at all.

### Example

> "Add a new candidate: James Park, VP of Operations at Ridgepoint Partners, based in New York, email james.park@ridgepoint.com"

Claude calls `loxo_create_candidate` with `name: "James Park"`, `email: "james.park@ridgepoint.com"`, `current_title: "VP of Operations"`, `current_company: "Ridgepoint Partners"`, and `location: "New York"`. The candidate is now in Loxo and can be added to job pipelines.

### Related tools

- [`loxo_update_candidate`](/reference/candidate-management#loxo_update_candidate) -- add tags, skillsets, or additional details after creation
- [`loxo_upload_resume`](/reference/candidate-management#loxo_upload_resume) -- attach a resume to the new candidate
- [`loxo_add_to_pipeline`](/reference/jobs-pipeline#loxo_add_to_pipeline) -- add the new candidate to a job

---

## loxo_update_candidate

Update an existing candidate's details: profile fields, tags, skillsets, sector experience, person type, and source type. Use the reference data tools to look up IDs for skillsets, sectors, person types, and source types before calling this.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Candidate person ID |
| `name` | string | No | Full name |
| `email` | string | No | Email address to add |
| `phone` | string | No | Phone number to add |
| `current_title` | string | No | Current job title |
| `current_company` | string | No | Current employer |
| `location` | string | No | City, region, or country |
| `tags` | array of strings | No | Tags to set on the candidate |
| `skillset_ids` | array of numbers | No | Skillset IDs (from `loxo_list_skillsets`) |
| `sector_ids` | array of numbers | No | Sector IDs (from `loxo_list_skillsets`) |
| `person_type_id` | number | No | Person type ID (from `loxo_list_person_types`) |
| `source_type_id` | number | No | Source type ID (from `loxo_list_source_types`) |
| `owned_by_id` | string | No | Loxo user ID to set as record owner. If omitted, falls back to the `LOXO_DEFAULT_OWNER_ID` env var (if configured). If neither is set, the record is updated without changing ownership. |

> **Ownership precedence:** explicit `owned_by_id` arg wins over the `LOXO_DEFAULT_OWNER_ID` env var, which wins over no owner at all.

### Example

> "Update Sarah Chen's title to Managing Director and tag her as 'high-priority' and 'PE-background'"

Claude calls `loxo_update_candidate` with Sarah's person ID, `current_title: "Managing Director"`, and `tags: ["high-priority", "PE-background"]`. Her profile in Loxo is updated immediately.

### Related tools

- [`loxo_get_candidate`](/reference/candidates#loxo_get_candidate) -- verify the updated profile
- [`loxo_list_skillsets`](/reference/companies-data#loxo_list_skillsets) -- look up skillset and sector IDs
- [`loxo_list_person_types`](/reference/companies-data#loxo_list_person_types) -- look up person type IDs
- [`loxo_list_source_types`](/reference/companies-data#loxo_list_source_types) -- look up source type IDs

---

## loxo_upload_resume

Upload a CV or resume file to a candidate's profile. The file must be base64-encoded. Supported formats include PDF, DOCX, and DOC.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person_id` | string | Yes | The candidate's person ID |
| `file_name` | string | Yes | File name with extension (e.g., `"sarah-chen-resume.pdf"`) |
| `file_content_base64` | string | Yes | Base64-encoded file content |

### Example

> "Upload this resume PDF to Sarah Chen's profile"

Claude encodes the file as base64, then calls `loxo_upload_resume` with Sarah's person ID, `file_name: "sarah-chen-resume.pdf"`, and the base64-encoded content. The resume is now attached to her profile in Loxo and available for download.

### Related tools

- [`loxo_get_candidate`](/reference/candidates#loxo_get_candidate) -- verify the resume was attached to the profile
- [`loxo_create_candidate`](/reference/candidate-management#loxo_create_candidate) -- create the candidate first if they don't exist yet
