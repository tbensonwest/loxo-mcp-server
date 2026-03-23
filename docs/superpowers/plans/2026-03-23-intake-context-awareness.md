# Intake Context Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Claude aware of recruiter intake notes and filter activity noise so candidates get complete, intel-rich context across all workflows.

**Architecture:** Update 5 tool descriptions to cross-reference intake notes and guide Claude toward `loxo_get_candidate_brief`. Add server-side noise filtering to the brief handler using a blocklist of pipeline/automation activity type IDs, with pagination support. Full README rewrite. Version bump to 1.5.0.

**Tech Stack:** TypeScript, Vitest, MCP SDK, Zod

**Spec:** `docs/superpowers/specs/2026-03-23-intake-context-awareness-design.md`

---

### Pre-flight: Pull origin main and create branch

- [ ] **Step 1: Pull latest and create feature branch**

```bash
cd /home/tbizzlewiz/code/loxo-mcp-server
git checkout main
git pull origin main
git checkout -b feat/intake-context-awareness
```

---

### Task 1: Add noise activity type constant

**Files:**
- Modify: `src/server.ts` (add constant near top, after imports/types, before handlers)

- [ ] **Step 1: Write the failing test**

In `tests/handlers.test.ts`, add a new describe block after the existing imports. This test imports the constant and verifies it contains the expected IDs.

Since `NOISE_ACTIVITY_TYPE_IDS` is internal to `server.ts` and not exported, we'll test it indirectly through the brief handler in Task 3. Instead, add the constant now and verify the build passes.

- [ ] **Step 2: Add the constant to `src/server.ts`**

Add after the `PersonEventSchema` definition (~line 358) and before the `ListToolsRequestSchema` handler (~line 464):

```typescript
// Activity types that represent pipeline state transitions or automation events.
// Used by loxo_get_candidate_brief to filter out noise and return only intel-rich activities.
const NOISE_ACTIVITY_TYPE_IDS = new Set([
  1550048, // Marked as Maybe
  1550049, // Marked as Yes
  1550050, // Longlisted
  1550052, // Sent Automated Email
  1550054, // Applied
  1550055, // Added to Job
  1550056, // Unsourced
  1550057, // Outbound
  1550066, // Outreach™ Task Completed
  1550067, // Outreach™ SMS Sent
  1550068, // Outreach™ Email Sent
  1550069, // Outreach™ Added to Call Queue
  1550070, // Submitted
  1550071, // Scheduling
  1550072, // Consultant Interview
  1550073, // 1st Client Interview
  1550074, // 2nd Client Interview
  1550075, // 3rd Client Interview
  1550076, // Final Client Interview
  1550077, // Hold
  1550078, // Offer Extended
  1550079, // Hired
  1550080, // Rejected
  1550081, // Rejected by Client
  1550082, // Rejected by Candidate
  1550083, // Rejected by Consultant
  1550084, // Loxo AI Sourced
  1550085, // Form Filled
  2311492, // Linkedin Connection Request
  2373096, // Pitched
  2925520, // Updated by Self-updating CRM Agent
]);
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 4: Verify tests still pass**

Run: `npm test`
Expected: All existing tests pass

- [ ] **Step 5: Commit**

```bash
git add src/server.ts
git commit -m "feat: add NOISE_ACTIVITY_TYPE_IDS constant for activity filtering"
```

---

### Task 2: Write failing tests for filtered brief handler

**Files:**
- Modify: `tests/handlers.test.ts`

- [ ] **Step 1: Write tests for filtered activity behaviour**

Add these tests inside a new `describe` block after the existing `loxo_get_candidate_brief` tests (~line 126). These tests use the same `mockFetch` pattern as existing tests but provide activities with specific `activity_type_id` values.

```typescript
  // ─── loxo_get_candidate_brief (filtered activities) ─────────────────────

  describe('loxo_get_candidate_brief filtered activities', () => {
    // Helper to create a mock fetch that returns specific activities
    function mockBriefFetch(activities: unknown[], scrollId: string | null = null) {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        let data: unknown;
        if (url.includes('/emails')) {
          data = [{ value: 'test@example.com' }];
        } else if (url.includes('/phones')) {
          data = [{ value: '+44 7700 900000' }];
        } else if (url.includes('person_events')) {
          data = { person_events: activities, scroll_id: scrollId, total_count: activities.length };
        } else {
          data = { id: '42', name: 'Test Candidate', description: 'Intake notes here' };
        }
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }));
    }

    it('excludes noise activity types from results', async () => {
      mockBriefFetch([
        { id: 1, notes: 'Called re: role', activity_type_id: 1550062 },   // Outgoing Phone Call - intel
        { id: 2, notes: '', activity_type_id: 1550055 },                  // Added to Job - noise
        { id: 3, notes: 'Discussed salary', activity_type_id: 1550051 },  // Note Update - intel
        { id: 4, notes: '', activity_type_id: 1550079 },                  // Hired - noise
      ]);

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.recent_activities).toHaveLength(2);
      expect(parsed.recent_activities[0].id).toBe(1);
      expect(parsed.recent_activities[1].id).toBe(3);
    });

    it('returns empty activities when all are noise', async () => {
      mockBriefFetch([
        { id: 1, notes: '', activity_type_id: 1550055 },  // Added to Job
        { id: 2, notes: '', activity_type_id: 1550079 },  // Hired
        { id: 3, notes: '', activity_type_id: 2925520 },  // CRM Agent
      ]);

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.recent_activities).toHaveLength(0);
    });

    it('includes activity_pagination in response', async () => {
      mockBriefFetch(
        [{ id: 1, notes: 'Called', activity_type_id: 1550062 }],
        'abc123'
      );

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.activity_pagination).toBeDefined();
      expect(parsed.activity_pagination.scroll_id).toBe('abc123');
      expect(parsed.activity_pagination.has_more).toBe(true);
    });

    it('sets has_more false when no scroll_id from API', async () => {
      mockBriefFetch(
        [{ id: 1, notes: 'Called', activity_type_id: 1550062 }],
        null
      );

      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.activity_pagination.has_more).toBe(false);
      expect(parsed.activity_pagination.scroll_id).toBeNull();
    });

    it('passes scroll_id to API for pagination', async () => {
      mockBriefFetch([{ id: 10, notes: 'Older call', activity_type_id: 1550063 }]);

      await callTool(client, 'loxo_get_candidate_brief', { id: '42', scroll_id: 'page2cursor' });

      const fetchCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const eventsCall = fetchCalls.find(([url]: [string]) => url.includes('person_events'));
      expect(eventsCall).toBeDefined();
      expect(eventsCall![0]).toContain('scroll_id=page2cursor');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: The 5 new tests FAIL — the handler doesn't filter yet and doesn't return `activity_pagination`

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/handlers.test.ts
git commit -m "test: add failing tests for filtered brief activities and pagination"
```

---

### Task 3: Implement filtered brief handler

**Files:**
- Modify: `src/server.ts` — the `loxo_get_candidate_brief` handler (~lines 1570-1608) and its input schema (~lines 1001-1012)

- [ ] **Step 1: Update the input schema**

In the `ListToolsRequestSchema` handler, find the `loxo_get_candidate_brief` tool definition (~line 1001). Update the description and add `scroll_id` to properties:

Replace the description string (~line 1003):
```typescript
        description: "Get a complete candidate brief in one call: full profile (including recruiter intake/call notes in the 'description' field), all contact details, and recent intel-rich activities (calls, emails, notes, interviews — filtered to exclude pipeline moves and automation noise). Use this as the first step whenever you need full candidate context — before drafting outreach, preparing client briefing packs, pipeline status updates, or evaluating candidate-role fit. The combination of intake notes and activity history gives the most complete picture of a candidate. Supports pagination via scroll_id for retrieving older activity when you need to dig deeper (e.g. finding salary expectations from an earlier conversation). Returns: profile fields, email list, phone list, recent_activities (intel-rich only), activity_pagination.",
```

Add `scroll_id` to the properties object (after `response_format`):
```typescript
            scroll_id: { type: "string", description: "Pagination cursor for older intel-rich activities." },
```

- [ ] **Step 2: Update the handler implementation**

Replace the `loxo_get_candidate_brief` case block (~lines 1570-1608) with:

```typescript
      case "loxo_get_candidate_brief": {
        const { id, scroll_id, response_format = 'json' } = args as any;

        requireNumericId(id, 'id');

        const activityParams = new URLSearchParams();
        activityParams.append('person_id', id.toString());
        activityParams.append('per_page', '50');
        if (scroll_id) activityParams.append('scroll_id', scroll_id);

        const [profileResult, emailsResult, phonesResult, activitiesResult] = await Promise.allSettled([
          makeRequest<Candidate>(`/${env.LOXO_AGENCY_SLUG}/people/${id}`),
          makeRequest<EmailInfo[]>(`/${env.LOXO_AGENCY_SLUG}/people/${id}/emails`),
          makeRequest<PhoneInfo[]>(`/${env.LOXO_AGENCY_SLUG}/people/${id}/phones`),
          makeRequest<any>(`/${env.LOXO_AGENCY_SLUG}/person_events?${activityParams.toString()}`),
        ]);

        if (profileResult.status === 'rejected') {
          throw profileResult.reason;
        }

        const profile = profileResult.value;
        const emails = emailsResult.status === 'fulfilled' ? emailsResult.value : [];
        const phones = phonesResult.status === 'fulfilled' ? phonesResult.value : [];
        const activitiesResponse = activitiesResult.status === 'fulfilled' ? activitiesResult.value : null;

        const allActivities = activitiesResponse?.person_events
          || activitiesResponse?.events
          || activitiesResponse
          || [];

        const filteredActivities = Array.isArray(allActivities)
          ? allActivities.filter((a: any) => !NOISE_ACTIVITY_TYPE_IDS.has(a.activity_type_id))
          : [];

        const brief = {
          profile,
          emails,
          phones,
          recent_activities: filteredActivities,
          activity_pagination: {
            scroll_id: activitiesResponse?.scroll_id || null,
            has_more: !!(activitiesResponse?.scroll_id),
          },
        };

        const formatted = formatResponse(brief, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return { content: [{ type: "text", text }] };
      }
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass including the 5 new filtered activity tests

- [ ] **Step 4: Run build to verify no type errors**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 5: Commit**

```bash
git add src/server.ts
git commit -m "feat: filter noise activities in candidate brief, add pagination support"
```

---

### Task 4: Update remaining tool descriptions

**Files:**
- Modify: `src/server.ts` — tool descriptions in `ListToolsRequestSchema` handler

- [ ] **Step 1: Write tests for tool description cross-references**

Add to `tests/handlers.test.ts` after the filtered activities tests:

```typescript
  // ─── Tool description cross-references ──────────────────────────────────

  describe('tool descriptions guide toward candidate brief', () => {
    it('loxo_get_candidate mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        { parse: (r: any) => r } as any
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_get_candidate');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });

    it('loxo_get_candidate_activities mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        { parse: (r: any) => r } as any
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_get_candidate_activities');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });

    it('loxo_get_job_pipeline mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        { parse: (r: any) => r } as any
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_get_job_pipeline');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });

    it('loxo_search_candidates mentions loxo_get_candidate_brief', async () => {
      const result = await client.request(
        { method: 'tools/list', params: {} },
        { parse: (r: any) => r } as any
      );
      const tool = result.tools.find((t: any) => t.name === 'loxo_search_candidates');
      expect(tool.description).toContain('loxo_get_candidate_brief');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: The 4 new description tests FAIL — descriptions don't mention `loxo_get_candidate_brief` yet (except the brief's own)

- [ ] **Step 3: Update `loxo_get_candidate` description**

In `src/server.ts` (~line 627), replace the description string:

```typescript
        description: "Get complete candidate profile including bio, location, current role, skills, tags, compensation, and embedded lists of jobs/education/emails/phones. The 'description' field contains the recruiter's call and intake notes — personal circumstances, motivations, compensation expectations, and role preferences. This is often the richest source of candidate intelligence. For a complete picture combining intake notes with recent activity (including Ringover call summaries), use loxo_get_candidate_brief instead. Example: After searching candidates, use their ID here to get full details.",
```

- [ ] **Step 4: Update `loxo_get_candidate_activities` description**

In `src/server.ts` (~line 987), replace the description string:

```typescript
        description: "Get the full unfiltered activity history for a candidate — all calls, emails, meetings, notes, pipeline moves, and automation events. Returns most recent activities first. For a filtered view with only intel-rich activities (excluding pipeline noise), use loxo_get_candidate_brief instead. For the recruiter's own call/intake notes (motivations, personal circumstances, compensation), check the 'description' field via loxo_get_candidate or loxo_get_candidate_brief. Example: Before emailing a candidate, call this to check if someone already contacted them last week.",
```

- [ ] **Step 5: Update `loxo_get_job_pipeline` description**

In `src/server.ts` (~line 1015), replace the description string:

```typescript
        description: "Get all candidates in the pipeline for a specific job, with their current stage. Returns candidate IDs and pipeline stages only. For client briefing packs or status updates, follow up with loxo_get_candidate_brief for each candidate to get their intake notes, personal context, and recent activity (including Ringover call summaries). Example: 'Show me the pipeline for job 456' returns all candidates and their stage (sourced, screened, interviewing, offer, placed).",
```

- [ ] **Step 6: Update `loxo_search_candidates` description**

In `src/server.ts` (~line 570), find the `Returns:` line at the end of the description and insert before it:

```
When evaluating candidate fit for a role or preparing recommendations, follow up with loxo_get_candidate_brief for shortlisted candidates to get recruiter intake notes and recent activity context.\n\n
```

So the description ends with: `...follow up with loxo_get_candidate_brief for shortlisted candidates to get recruiter intake notes and recent activity context.\n\nReturns: id, name, current_title, current_company, location, skillsets (from 'skills' field), all_raw_tags. Use scroll_id from pagination for next page."`

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 8: Run build**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 9: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: update tool descriptions to guide Claude toward intake notes and candidate brief"
```

---

### Task 5: Update existing brief test for backward compatibility

**Files:**
- Modify: `tests/handlers.test.ts`

- [ ] **Step 1: Update the existing `loxo_get_candidate_brief` test**

The existing test (~line 96) returns an activity with no `activity_type_id`, which would pass the noise filter (blocklist approach = unknown types are included). But the response shape has changed — it now includes `activity_pagination`. Update the assertions:

Find the existing test assertions (~lines 121-125) and replace:

```typescript
      const result = await callTool(client, 'loxo_get_candidate_brief', { id: '42' });
      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('Jane Smith');
      expect(text).toContain('jane@example.com');
      expect(text).toContain('recent_activities');
      expect(text).toContain('activity_pagination');
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/handlers.test.ts
git commit -m "test: update existing brief test for new response shape"
```

---

### Task 6: README overhaul

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README and all tool names**

Read the full README and the complete list of tools from the `ListToolsRequestSchema` handler in `src/server.ts` to ensure nothing is missed.

- [ ] **Step 2: Rewrite README**

Keep the installation, configuration, and Docker sections as-is. Rewrite everything else:

- Update the header description to reflect current version
- Reorganise the tools section around recruiter workflows:
  - **Find & Research Candidates** — `loxo_search_candidates`, `loxo_get_candidate`, `loxo_get_candidate_brief`, `loxo_get_person_emails`, `loxo_get_person_phones`, `loxo_list_person_job_profiles`, `loxo_get_person_job_profile_detail`, `loxo_list_person_education_profiles`, `loxo_get_person_education_profile_detail`
  - **Manage Pipeline & Jobs** — `loxo_search_jobs`, `loxo_get_job`, `loxo_get_job_pipeline`, `loxo_add_to_pipeline`
  - **Track Activity & Communication** — `loxo_get_candidate_activities`, `loxo_log_activity`, `loxo_schedule_activity`, `loxo_get_todays_tasks`, `loxo_get_activity_types`
  - **Companies & Reference Data** — `loxo_search_companies`, `loxo_get_company_details`, `loxo_list_users`, `loxo_list_skillsets`, `loxo_list_source_types`, `loxo_list_person_types`
  - **Candidate Management** — `loxo_create_candidate`, `loxo_update_candidate`, `loxo_upload_resume`
- Use correct `loxo_` prefixed tool names throughout
- Add workflow examples for:
  - Preparing a client briefing pack (pipeline → brief for each candidate)
  - Candidate status update
  - Matching candidates to a new role (search → brief → evaluate)
- Remove stale "New in v2" section
- Remove outdated "Implementation Notes" section (the "Recent Changes" are now old)
- Keep Architecture, Pagination, and Activity/Event System sections but update them
- Make it client-readable — Heather should understand what each tool does
- Update version reference from v1.3.1 to v1.5.0

- [ ] **Step 3: Verify links and formatting**

Read through the written README to check for broken markdown, missing sections, or stale references.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: full README overhaul — workflow-oriented, client-readable, all tools documented"
```

---

### Task 7: Version bump

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version in package.json**

Change `"version": "1.4.1"` to `"version": "1.5.0"` in `package.json` line 3.

- [ ] **Step 2: Run build and tests**

Run: `npm run build && npm test`
Expected: Clean build, all tests pass

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors (existing `no-explicit-any` warnings are expected)

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 1.5.0"
```

---

### Task 8: Final verification and PR

- [ ] **Step 1: Run full CI check locally**

```bash
npm run lint && npm run build && npm test
```

Expected: All pass

- [ ] **Step 2: Push and create PR**

```bash
git push -u origin feat/intake-context-awareness
```

Create PR against `main` with title and body summarising the changes. Tag will be created after merge.
