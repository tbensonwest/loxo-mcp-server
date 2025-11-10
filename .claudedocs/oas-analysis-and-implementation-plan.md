# Loxo MCP Server - OAS Analysis & Implementation Plan

## Critical Implementation Errors

### Endpoints That Don't Exist in OAS - MUST REMOVE

1. **spark-search-activity-types**
   - Code references: `/${agency_slug}/spark_search/activity_types`
   - OAS status: ❌ Not found
   - Action: **DELETE tool entirely**

2. **get-call-queue**
   - Code references: `/${agency_slug}/call-queue`
   - OAS status: ❌ Not found
   - Action: **DELETE tool entirely**

3. **add-to-call-queue**
   - Code references: `/${agency_slug}/call-queue`
   - OAS status: ❌ Not found
   - Action: **DELETE tool entirely**

4. **add-note**
   - Code references: `/${agency_slug}/candidates/{id}/notes` and `/${agency_slug}/jobs/{id}/notes`
   - OAS status: ❌ No standalone notes endpoint
   - Notes are fields in `person_event[notes]` and `job[internal_notes]`
   - Action: **DELETE tool entirely** (use person_events instead)

### Endpoints Using Wrong Paths - MUST FIX

5. **schedule-activity**
   - Current: POST `/${agency_slug}/candidates/{id}/activities`
   - Correct: POST `/${agency_slug}/person_events`
   - Body: `person_event[person_id]`, `person_event[activity_type_id]`, `person_event[notes]`, `person_event[created_at]` (for scheduled)
   - OAS operation: `person_events:create`

6. **log-activity**
   - Current: POST `/${agency_slug}/candidates/{id}/activities`
   - Correct: POST `/${agency_slug}/person_events`
   - Body: Same as schedule-activity, but no future date (logged now)
   - OAS operation: `person_events:create`

7. **get-todays-tasks**
   - Current: GET `/${agency_slug}/activities/scheduled?date=...`
   - Correct: GET `/${agency_slug}/schedule_items?user_id=...&start_date=...&end_date=...`
   - OAS operation: `schedule_items:index`
   - Supports: scroll_id, per_page pagination

8. **search-jobs**
   - Current: GET `/${agency_slug}/jobs/search?q=...`
   - Correct: GET `/${agency_slug}/jobs?query=...&page=...&per_page=...`
   - OAS operation: `jobs:index`
   - Pagination: Uses `page` and `per_page`, NOT scroll_id

## OAS Endpoint Verification

### Working Correctly ✅

| Tool | Endpoint | OAS Operation |
|------|----------|---------------|
| get-activity-types | `/{slug}/activity_types` | activity_types:index |
| search-candidates | `/{slug}/people?query=...` | people:index |
| get-candidate | `/{slug}/people/{id}` | people:show |
| get-person-emails | `/{slug}/people/{id}/emails` | person_emails:index |
| get-person-phones | `/{slug}/people/{id}/phones` | person_phones:index |
| list-person-job-profiles | `/{slug}/people/{id}/job_profiles` | person_job_profiles:index |
| get-person-job-profile-detail | `/{slug}/people/{id}/job_profiles/{job_id}` | person_job_profiles:show |
| list-person-education-profiles | `/{slug}/people/{id}/education_profiles` | person_education_profiles:index |
| get-person-education-profile-detail | `/{slug}/people/{id}/education_profiles/{edu_id}` | person_education_profiles:show |
| get-job | `/{slug}/jobs/{id}` | jobs:show |
| search-companies | `/{slug}/companies?query=...` | companies:index |
| get-company-details | `/{slug}/companies/{id}` | companies:show |
| list-users | `/{slug}/users` | users:index |

## MCP Best Practices Violations

### 1. Tool Naming - Missing Prefixes (CRITICAL)
- **Issue**: All tools lack `loxo_` prefix
- **Risk**: Name conflicts with other MCP servers
- **Fix**: Rename all tools with prefix
  - `get-activity-types` → `loxo_get_activity_types`
  - `search-candidates` → `loxo_search_candidates`
  - etc.

### 2. Missing Tool Annotations
- **Issue**: No annotations on any tool
- **Fix**: Add to all tools:
  ```typescript
  annotations: {
    readOnlyHint: true,        // for GET operations
    destructiveHint: false,     // for non-destructive POSTs
    idempotentHint: false,      // most are not idempotent
    openWorldHint: true         // all interact with external API
  }
  ```

### 3. No Response Format Options
- **Issue**: All tools return only JSON
- **Fix**: Add `response_format` parameter (default: "markdown")
  - "json": Machine-readable structured data
  - "markdown": Human-readable formatted text
- Implement formatting helpers

### 4. No Character Limits
- **Issue**: Could return overwhelming amounts of data
- **Fix**:
  - Define `CHARACTER_LIMIT = 25000` constant
  - Check response size before returning
  - Truncate gracefully with clear messages
  - Guide users on filtering options

### 5. Minimal Tool Descriptions
- **Issue**: Descriptions don't include usage examples
- **Fix**: Add:
  - Usage examples in descriptions
  - Parameter combination guidance
  - Lucene query syntax examples
  - When to use which tool

### 6. Poor Error Messages
- **Issue**: Generic error messages, exposed internal errors
- **Fix**:
  - Make errors actionable
  - Suggest specific next steps
  - Hide internal implementation details
  - Handle common errors (auth, rate limiting, not found)

### 7. Incomplete Pagination Metadata
- **Issue**: Missing helpful pagination info
- **Fix**: Return in responses:
  - `has_more`: boolean
  - `total_count`: number
  - `next_offset` or `next_page`: string/number
  - Handle both scroll_id (people) and page-based (jobs)

## Available OAS Operations Not Implemented

### High-Value Operations to Consider:

**Person/Candidate:**
- `people:create` - Create new candidates
- `people:update` - Update candidate info
- `person_events:index` - List all events for a person
- `person_events:show` - Get event details
- `person_lists:index` - Get person lists
- `person_list_items:create` - Add candidate to list

**Jobs:**
- `jobs:create` - Create new job
- `jobs:update` - Update job
- `job_contacts:index` - List job contacts
- `job_contacts:create` - Add contact to job
- `jobs:apply` - Apply candidate to job

**Companies:**
- `companies:create` - Create company
- `company_people:index` - List people at company

**Documents:**
- `person_documents:create` - Upload candidate document
- `person_documents:download` - Download candidate document
- `resumes:download` - Download resume

**Forms & Scorecards:**
- `forms:index` - List forms
- `scorecards:index` - List scorecards
- `scorecards:create` - Create scorecard

## Implementation Priority

### Phase 1: Fix Critical Errors (Blocking)
1. Remove non-existent tools: spark-search-activity-types, get/add-call-queue, add-note
2. Fix schedule-activity to use person_events
3. Fix log-activity to use person_events
4. Fix get-todays-tasks to use schedule_items
5. Fix search-jobs pagination (page/per_page instead of scroll_id)

### Phase 2: MCP Compliance (Required)
6. Add `loxo_` prefix to ALL tool names
7. Add tool annotations to ALL tools
8. Implement response_format parameter (json/markdown)
9. Add CHARACTER_LIMIT and truncation logic
10. Enhance tool descriptions with examples
11. Improve error messages
12. Add pagination metadata to responses

### Phase 3: Testing & Validation
13. Build: `npm run build`
14. Test all tools with real API
15. Create evaluation harness with 10 test questions
16. Document test results

### Phase 4: Enhancements (Optional)
17. Add high-value missing operations (create candidate, create job, etc.)
18. Add batch operations helpers
19. Add caching for reference data (activity_types, etc.)
20. Add rate limiting handling

## Key OAS Findings

### Pagination Patterns:
- **People/Companies/Events**: scroll_id based (cursor pagination)
- **Jobs**: page/per_page based (offset pagination)
- **Both support**: per_page parameter

### Authentication:
- Bearer token in Authorization header
- Configured via LOXO_API_KEY env var

### Request Body Format:
- Most POST/PUT use `multipart/form-data`
- Field names use bracket notation: `person[name]`, `job[title]`

### ID Types:
- person_id: Can be string or integer (implementation uses string)
- company_id: Integer
- job_id: Integer

### Common Query Parameters:
- `query`: Lucene syntax search
- `scroll_id` or `page`: Pagination
- `per_page`: Results per page
- `include_related_agencies`: Boolean
- `fields`: Object for dynamic field filtering

## Next Steps

1. Review this plan
2. Confirm approach
3. Execute Phase 1 (fix critical errors)
4. Execute Phase 2 (MCP compliance)
5. Test thoroughly
6. Create evaluation harness
