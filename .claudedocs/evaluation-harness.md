# Loxo MCP Server - Evaluation Harness

## Overview
This evaluation harness contains 10 test scenarios to validate the Loxo MCP server's functionality, error handling, and MCP best practices implementation.

## Prerequisites
- Loxo API credentials configured in `.env`
- MCP server built and running
- Claude Desktop or compatible MCP client

## Test Scenarios

### 1. Basic Activity Type Retrieval
**Objective**: Verify activity types can be retrieved and response formatting works

**Query**: "What activity types are available in Loxo?"

**Expected Behavior**:
- Tool used: `loxo_get_activity_types`
- Response contains list of activity types with IDs
- Response is under 25,000 character limit
- Default JSON format returned

**Validation**:
- [ ] Activity types returned successfully
- [ ] Response includes activity type IDs
- [ ] No truncation warning present
- [ ] Response parseable as JSON

---

### 2. Candidate Search with Lucene Query
**Objective**: Test Lucene query syntax and pagination metadata

**Query**: "Find candidates who previously worked at Google and have Python skills"

**Expected Behavior**:
- Tool used: `loxo_search_candidates`
- Query should use: `job_profiles.company_name:"Google" AND skillsets:"Python"`
- Response includes pagination metadata:
  - `scroll_id` (if more results)
  - `has_more` boolean
  - `total_count`
  - `returned_count`

**Validation**:
- [ ] Lucene query correctly constructed
- [ ] Results contain relevant candidates
- [ ] Pagination object present
- [ ] `has_more` accurately indicates if more results exist

---

### 3. Candidate Profile Retrieval
**Objective**: Verify detailed candidate data retrieval

**Query**: "Get full details for candidate ID [use ID from previous search]"

**Expected Behavior**:
- Tool used: `loxo_get_candidate`
- Response includes:
  - Basic info (name, location, current role)
  - Work history
  - Education
  - Skills/tags
  - Contact info (if available)

**Validation**:
- [ ] Candidate profile returned
- [ ] Response includes job profiles
- [ ] Response includes education profiles
- [ ] No sensitive data exposed in errors

---

### 4. Pagination Workflow
**Objective**: Test multi-page result handling

**Query**: "Search for all software engineers, then get the next page of results"

**Expected Behavior**:
- First call: `loxo_search_candidates` with `query="title:\"Software Engineer\""`
- Response includes `scroll_id`
- Second call: Same search with `scroll_id` from first response
- Different results returned

**Validation**:
- [ ] First page returns results with scroll_id
- [ ] Second page uses scroll_id correctly
- [ ] Different candidates in each page
- [ ] `has_more` correctly updates

---

### 5. Job Search with Page-Based Pagination
**Objective**: Test page-based pagination (different from scroll_id)

**Query**: "Find remote engineering positions, page 2"

**Expected Behavior**:
- Tool used: `loxo_search_jobs`
- Query: `location:"Remote" AND title:"Engineer"`
- Page parameter: `page=2`
- Response includes:
  - `page: 2`
  - `total_pages`
  - `next_page` (or null if last page)
  - `has_more`

**Validation**:
- [ ] Page-based pagination metadata present
- [ ] `next_page` correctly calculated
- [ ] `total_pages` matches total_count/per_page
- [ ] Results specific to page 2

---

### 6. Activity Scheduling Workflow
**Objective**: Test activity creation with proper workflow

**Query**: "Schedule a call with candidate [ID] for tomorrow at 2pm"

**Expected Behavior**:
- First: `loxo_get_activity_types` to get call activity type ID
- Then: `loxo_schedule_activity` with:
  - `person_id`: candidate ID
  - `activity_type_id`: from first call
  - `created_at`: tomorrow at 14:00 ISO format
  - `notes`: about the call

**Validation**:
- [ ] Activity types retrieved first
- [ ] Correct activity_type_id used
- [ ] ISO datetime format for created_at
- [ ] Activity created successfully

---

### 7. Error Handling - Invalid ID
**Objective**: Test 404 error handling and actionable messages

**Query**: "Get candidate with ID 99999999"

**Expected Behavior**:
- Tool used: `loxo_get_candidate`
- API returns 404
- Error message includes:
  - Clear "Resource not found" message
  - ID mentioned in error
  - "Next steps" section
  - Suggestion to verify ID or use search

**Validation**:
- [ ] Error message is user-friendly
- [ ] "Next steps" guidance provided
- [ ] No internal stack traces exposed
- [ ] Suggests using search tools

---

### 8. Error Handling - Authentication
**Objective**: Test 401 error with invalid API key

**Setup**: Temporarily use invalid API key in .env

**Query**: "List activity types"

**Expected Behavior**:
- API returns 401
- Error message includes:
  - "Authentication failed" message
  - Steps to verify LOXO_API_KEY
  - Suggestion to check API key expiration
  - No actual API key value exposed

**Validation**:
- [ ] Clear authentication error message
- [ ] "Next steps" for fixing auth
- [ ] No API key leaked in error
- [ ] Suggests checking .env configuration

**Cleanup**: Restore valid API key

---

### 9. Response Format Selection
**Objective**: Test markdown vs JSON response formatting

**Query**: "Get activity types in markdown format"

**Expected Behavior**:
- Tool used: `loxo_get_activity_types`
- Parameter: `response_format="markdown"`
- Response wrapped in markdown code block
- Still properly formatted and readable

**Validation**:
- [ ] Response in markdown format
- [ ] Wrapped in ```json code block
- [ ] Still parseable when extracted
- [ ] Truncation works with markdown format

---

### 10. Character Limit and Truncation
**Objective**: Test response truncation at 25,000 character limit

**Query**: "Search for all candidates" (intentionally broad to get many results)

**Expected Behavior**:
- Large result set returned
- If > 25,000 characters:
  - Response truncated at 25,000
  - Truncation message appended
  - Message suggests using filters
  - Original length mentioned

**Validation**:
- [ ] Response under or at 25,000 characters
- [ ] If truncated, message clearly indicates it
- [ ] Truncation message is helpful
- [ ] Suggests filtering parameters

---

## Evaluation Scoring

### Pass Criteria
- All 10 scenarios execute without crashes
- Error handling provides actionable guidance
- Pagination metadata present and accurate
- Response formatting works correctly
- Character limits enforced appropriately

### Evaluation Checklist

**Functionality** (40 points):
- [ ] All tools respond successfully (10 points)
- [ ] Search queries work with Lucene syntax (10 points)
- [ ] Pagination works for both scroll_id and page-based (10 points)
- [ ] Activity workflows complete successfully (10 points)

**Error Handling** (30 points):
- [ ] 404 errors provide actionable guidance (10 points)
- [ ] 401 errors handled with clear steps (10 points)
- [ ] No sensitive data exposed in errors (10 points)

**MCP Best Practices** (30 points):
- [ ] Response format parameter works (10 points)
- [ ] Character limits enforced with helpful messaging (10 points)
- [ ] Pagination metadata complete and accurate (10 points)

**Total Score**: _____ / 100

### Result Categories
- **90-100**: Excellent - Production ready
- **75-89**: Good - Minor improvements needed
- **60-74**: Acceptable - Significant improvements needed
- **< 60**: Needs work - Major issues to address

## Notes

Record any issues, unexpected behavior, or suggestions for improvement:

```
[Date]: [Tester]
[Notes]
```

---

## Continuous Improvement

After completing evaluation:
1. Document any failed scenarios
2. Create GitHub issues for bugs
3. Update implementation plan with findings
4. Re-run after fixes
5. Update this harness with new edge cases discovered
