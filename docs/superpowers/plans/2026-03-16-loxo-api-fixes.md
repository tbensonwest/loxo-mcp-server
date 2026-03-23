# Loxo MCP Server v1.4 — API Fixes & New Capabilities

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken create/pipeline tools, add resume upload, reference-data tools, and enrichment fields so Claude can run a full recruiter workflow end-to-end.

**Architecture:** All changes are in `src/server.ts` (monolith — follows existing pattern). New tools follow the existing pattern: define in `ListToolsRequestSchema` handler → implement case in `CallToolRequestSchema` switch. All new tools use Zod schemas for validation.

**Tech Stack:** TypeScript, MCP SDK, Zod, Vitest, form-urlencoded + multipart/form-data

**Spec:** `docs/superpowers/specs/2026-03-16-loxo-api-fixes-design.md`

---

## File Structure

All changes are in 3 files:

| File | Changes |
|---|---|
| `src/server.ts` | Fix 3 existing tools, add 4 new tools, update schemas/types |
| `tests/handlers.test.ts` | Add/update tests for all changed tools |
| `package.json` | Bump version to 1.4.0 |

---

## Chunk 1: Fix `loxo_create_candidate`

### Task 1: Update CreateCandidateSchema and handler

**Files:**
- Modify: `src/server.ts:405-414` (CreateCandidateSchema)
- Modify: `src/server.ts:934-950` (tool definition in ListTools)
- Modify: `src/server.ts:1423-1447` (handler)

- [ ] **Step 1: Write failing test — create candidate sends correct form fields**

In `tests/handlers.test.ts`, replace the existing `loxo_create_candidate` describe block (lines 187-211):

```typescript
describe('loxo_create_candidate', () => {
  it('sends person[email] and person[phone] (not bracket-array notation)', async () => {
    let capturedBody = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
      capturedBody = opts?.body || '';
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({
          person: { id: 99, name: 'TEST - Jane Doe', emails: [{ value: 'jane@test.com' }], phones: [{ value: '447700900000' }] }
        })),
      });
    }));
    const result = await callTool(client, 'loxo_create_candidate', {
      name: 'TEST - Jane Doe',
      email: 'jane@test.com',
      phone: '+447700900000',
      current_title: 'Analyst',
      current_company: 'Test Corp',
    });
    expect(result.isError).toBeFalsy();
    // Must use simple field names, NOT email_addresses[][value]
    expect(capturedBody).toContain('person%5Bemail%5D=');     // person[email]
    expect(capturedBody).toContain('person%5Bphone%5D=');     // person[phone]
    expect(capturedBody).not.toContain('email_addresses');
    expect(capturedBody).not.toContain('phone_numbers');
    expect(capturedBody).not.toContain('source_type_id');
  });

  it('returns error when required name is missing', async () => {
    const result = await callTool(client, 'loxo_create_candidate', {
      email: 'no-name@example.com',
    });
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/handlers.test.ts -t "sends person\[email\]"`
Expected: FAIL — current code sends `email_addresses` not `email`

- [ ] **Step 3: Update CreateCandidateSchema**

In `src/server.ts`, replace `CreateCandidateSchema` (lines 405-414):

```typescript
const CreateCandidateSchema = z.object({
  name: z.string().describe("Full name of the candidate (required)."),
  email: z.string().optional().describe("Primary email address."),
  phone: z.string().optional().describe("Primary phone number."),
  current_title: z.string().optional().describe("Current job title."),
  current_company: z.string().optional().describe("Current employer name."),
  location: z.string().optional().describe("City, region, or country."),
});
```

Note: `person_type_id`, `tags`, `skillsets`, `source_type_id` are deliberately excluded from create — the Loxo API silently ignores or auto-sets them on POST. Use `loxo_update_candidate` (PUT) to set these after creating.

- [ ] **Step 4: Update tool definition in ListToolsRequestSchema**

In `src/server.ts`, replace the `loxo_create_candidate` tool definition (lines 933-951):

```typescript
{
  name: "loxo_create_candidate",
  description: "Create a new candidate record in Loxo with name, contact info, and current role. Source type is auto-set to 'API'. After creating, use loxo_update_candidate to set tags, skillsets, person_type, source_type, and sector — these fields require a separate PUT call. Example workflow: (1) loxo_create_candidate with name/email/phone/title/company, (2) loxo_update_candidate to add tags and skillset, (3) loxo_add_to_pipeline to add to a job.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Full name (required)." },
      email: { type: "string", description: "Primary email address." },
      phone: { type: "string", description: "Primary phone number." },
      current_title: { type: "string", description: "Current job title." },
      current_company: { type: "string", description: "Current employer." },
      location: { type: "string", description: "City, region, or country." },
    },
    required: ["name"],
  },
},
```

- [ ] **Step 5: Update handler**

In `src/server.ts`, replace the `loxo_create_candidate` case (lines 1423-1447):

```typescript
case "loxo_create_candidate": {
  const { name, email, phone, current_title, current_company, location } = CreateCandidateSchema.parse(args);

  const formData = new URLSearchParams();
  formData.append('person[name]', name);
  if (email) formData.append('person[email]', email);
  if (phone) formData.append('person[phone]', phone);
  if (current_title) formData.append('person[title]', current_title);
  if (current_company) formData.append('person[company]', current_company);
  if (location) formData.append('person[location]', location);

  const response = await makeRequest(
    `/${env.LOXO_AGENCY_SLUG}/people`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }
  );
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_create_candidate"`
Expected: PASS (both tests)

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "fix: loxo_create_candidate uses correct field names (person[email], person[phone])

The Loxo API rejects bracket-array notation (email_addresses[][value],
phone_numbers[][value]) on POST /people. Use simple field names instead.
Remove tags, person_type_id, source_type_id from create schema — these
are not settable on POST and must be set via follow-up PUT call."
```

---

## Chunk 2: Fix `loxo_update_candidate`

### Task 2: Rewrite UpdateCandidateSchema and handler to use PUT with enrichment fields

**Files:**
- Modify: `src/server.ts:416-426` (UpdateCandidateSchema)
- Modify: `src/server.ts:952-971` (tool definition)
- Modify: `src/server.ts:1449-1480` (handler)

- [ ] **Step 1: Write failing test — update sends PUT with correct enrichment fields**

In `tests/handlers.test.ts`, replace the existing `loxo_update_candidate` describe block (lines 215-236):

```typescript
describe('loxo_update_candidate', () => {
  it('sends PUT with person[all_raw_tags][] array and person[custom_hierarchy_1][]', async () => {
    let capturedMethod = '';
    let capturedBody = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: any) => {
      capturedMethod = opts?.method || 'GET';
      capturedBody = opts?.body || '';
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({
          person: { id: 42, name: 'Jane Smith', all_raw_tags: 'debt-advisory, sourced', custom_hierarchy_1: [{ id: 5704030, value: 'Debt Advisory' }] }
        })),
      });
    }));
    const result = await callTool(client, 'loxo_update_candidate', {
      id: '42',
      current_title: 'Senior Analyst',
      tags: ['debt-advisory', 'sourced'],
      skillset_ids: [5704030],
      person_type_id: 80073,
      source_type_id: 1206583,
    });
    expect(result.isError).toBeFalsy();
    expect(capturedMethod).toBe('PUT');
    // Tags must use array notation person[all_raw_tags][]=x
    expect(capturedBody).toContain('person%5Ball_raw_tags%5D%5B%5D=debt-advisory');
    expect(capturedBody).toContain('person%5Ball_raw_tags%5D%5B%5D=sourced');
    // Skillsets use custom_hierarchy_1
    expect(capturedBody).toContain('person%5Bcustom_hierarchy_1%5D%5B%5D=5704030');
    // Person type uses singular form
    expect(capturedBody).toContain('person%5Bperson_type_id%5D=80073');
    // Source type
    expect(capturedBody).toContain('person%5Bsource_type_id%5D=1206583');
  });

  it('returns error when only id is provided (empty body guard)', async () => {
    const result = await callTool(client, 'loxo_update_candidate', { id: '42' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No fields provided to update');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/handlers.test.ts -t "sends PUT with person"`
Expected: FAIL — current code uses PATCH and different field names

- [ ] **Step 3: Update UpdateCandidateSchema**

In `src/server.ts`, replace `UpdateCandidateSchema` (lines 416-426):

```typescript
const UpdateCandidateSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be numeric").describe("The candidate's person ID."),
  name: z.string().optional().describe("Full name."),
  email: z.string().optional().describe("Email address to add."),
  phone: z.string().optional().describe("Phone number to add."),
  current_title: z.string().optional().describe("Current job title."),
  current_company: z.string().optional().describe("Current employer name."),
  location: z.string().optional().describe("City, region, or country."),
  tags: z.array(z.string()).optional().describe("Tags to set (replaces existing). E.g. ['cv-import', 'debt-advisory']."),
  skillset_ids: z.array(z.number().int()).optional().describe("Skillset hierarchy IDs. Use loxo_list_skillsets to discover IDs. E.g. [5704030] for Debt Advisory."),
  sector_ids: z.array(z.number().int()).optional().describe("Sector hierarchy IDs. Use loxo_list_skillsets to discover IDs. E.g. [5690364] for Financial Services."),
  person_type_id: z.number().int().optional().describe("Person type ID. 80073=Active Candidate, 78122=Prospect Candidate. Use loxo_list_person_types to discover."),
  source_type_id: z.number().int().optional().describe("Source type ID. E.g. 1206583=LinkedIn, 1206592=API. Use loxo_list_source_types to discover."),
});
```

- [ ] **Step 4: Update tool definition in ListToolsRequestSchema**

In `src/server.ts`, replace the `loxo_update_candidate` tool definition (lines 952-971):

```typescript
{
  name: "loxo_update_candidate",
  description: "Update an existing candidate's record in Loxo. Use to set tags, skillsets, sector, person type, source type, and basic profile fields. Tags and skillsets require specific field formats — this tool handles the conversion automatically. Use loxo_list_skillsets and loxo_list_person_types to discover valid IDs before calling.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Candidate person ID (required)." },
      name: { type: "string", description: "Full name." },
      email: { type: "string", description: "Email address to add." },
      phone: { type: "string", description: "Phone number to add." },
      current_title: { type: "string", description: "Current job title." },
      current_company: { type: "string", description: "Current employer." },
      location: { type: "string", description: "City, region, or country." },
      tags: { type: "array", items: { type: "string" }, description: "Tags to set. E.g. ['cv-import', 'debt-advisory']." },
      skillset_ids: { type: "array", items: { type: "number" }, description: "Skillset IDs from loxo_list_skillsets. E.g. [5704030] = Debt Advisory." },
      sector_ids: { type: "array", items: { type: "number" }, description: "Sector IDs from loxo_list_skillsets. E.g. [5690364] = Financial Services." },
      person_type_id: { type: "number", description: "Person type ID. 80073=Active Candidate, 78122=Prospect Candidate." },
      source_type_id: { type: "number", description: "Source type ID. 1206583=LinkedIn, 1206592=API." },
    },
    required: ["id"],
  },
},
```

- [ ] **Step 5: Update handler**

In `src/server.ts`, replace the `loxo_update_candidate` case (lines 1449-1480):

```typescript
case "loxo_update_candidate": {
  const { id, name: updateName, email, phone, current_title, current_company, location, tags, skillset_ids, sector_ids, person_type_id, source_type_id } = UpdateCandidateSchema.parse(args);

  // Note: requireNumericId not needed — Zod regex already validates id format

  const formData = new URLSearchParams();
  if (updateName) formData.append('person[name]', updateName);
  if (email) formData.append('person[email]', email);
  if (phone) formData.append('person[phone]', phone);
  if (current_title) formData.append('person[title]', current_title);
  if (current_company) formData.append('person[company]', current_company);
  if (location) formData.append('person[location]', location);
  if (person_type_id) formData.append('person[person_type_id]', person_type_id.toString());
  if (source_type_id) formData.append('person[source_type_id]', source_type_id.toString());
  if (tags) {
    for (const tag of tags) {
      formData.append('person[all_raw_tags][]', tag);
    }
  }
  if (skillset_ids) {
    for (const sid of skillset_ids) {
      formData.append('person[custom_hierarchy_1][]', sid.toString());
    }
  }
  if (sector_ids) {
    for (const sid of sector_ids) {
      formData.append('person[custom_hierarchy_2][]', sid.toString());
    }
  }

  if (formData.toString() === '') {
    return {
      content: [{ type: "text", text: "No fields provided to update. Supply at least one optional field alongside id." }],
      isError: true
    };
  }

  const response = await makeRequest(
    `/${env.LOXO_AGENCY_SLUG}/people/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }
  );
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_update_candidate"`
Expected: PASS (both tests)

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "fix: loxo_update_candidate uses PUT with correct field names

Switch from PATCH to PUT. Tags use person[all_raw_tags][] array format.
Skillsets use person[custom_hierarchy_1][] with hierarchy IDs.
Add source_type_id, person_type_id (singular), skillset_ids, sector_ids."
```

---

## Chunk 3: Fix `loxo_apply_to_job` → `loxo_add_to_pipeline`

### Task 3: Replace apply_to_job with person_events-based pipeline addition

**Files:**
- Modify: `src/server.ts:1016-1027` (tool definition)
- Modify: `src/server.ts:1580-1599` (handler)

- [ ] **Step 1: Write failing test — add_to_pipeline uses person_events endpoint**

In `tests/handlers.test.ts`, replace the existing `loxo_apply_to_job` describe block (lines 240-266):

```typescript
describe('loxo_add_to_pipeline', () => {
  it('creates person_event with activity_type_id 1550055 (Added to Job)', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
      capturedUrl = url;
      capturedBody = opts?.body || '';
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({
          person_event: { id: 123, person_id: 42, job_id: 100, activity_type_id: 1550055, notes: 'Sourced from CV search' }
        })),
      });
    }));
    const result = await callTool(client, 'loxo_add_to_pipeline', {
      job_id: '100',
      person_id: '42',
      notes: 'Sourced from CV search',
    });
    expect(result.isError).toBeFalsy();
    // Must hit person_events endpoint, NOT jobs/{id}/contacts
    expect(capturedUrl).toContain('/person_events');
    expect(capturedUrl).not.toContain('/contacts');
    // Must include the "Added to Job" activity type
    expect(capturedBody).toContain('person_event%5Bactivity_type_id%5D=1550055');
    expect(capturedBody).toContain('person_event%5Bjob_id%5D=100');
    expect(capturedBody).toContain('person_event%5Bperson_id%5D=42');
  });

  it('returns error when job_id is missing', async () => {
    const result = await callTool(client, 'loxo_add_to_pipeline', { person_id: '42' });
    expect(result.isError).toBe(true);
  });

  it('returns error when person_id is missing', async () => {
    const result = await callTool(client, 'loxo_add_to_pipeline', { job_id: '100' });
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_add_to_pipeline"`
Expected: FAIL — tool doesn't exist yet

- [ ] **Step 3: Add Zod schema for AddToPipeline**

In `src/server.ts`, after the `UpdateCandidateSchema` (around line 426), add:

```typescript
const AddToPipelineSchema = z.object({
  job_id: z.string().regex(/^\d+$/, "job_id must be numeric").describe("The job ID to add the candidate to."),
  person_id: z.string().regex(/^\d+$/, "person_id must be numeric").describe("The candidate's person ID."),
  notes: z.string().optional().describe("Optional notes (e.g. 'Sourced from LinkedIn applications')."),
});
```

- [ ] **Step 4: Replace tool definition — rename to loxo_add_to_pipeline**

In `src/server.ts`, replace the `loxo_apply_to_job` tool definition (lines 1016-1027):

```typescript
{
  name: "loxo_add_to_pipeline",
  description: "Add a candidate to a job's pipeline. Creates an 'Added to Job' activity event which places the candidate in the pipeline at the first stage. Use after identifying a good candidate match. The candidate will then appear in loxo_get_job_pipeline results. Note: this is NOT the same as loxo_log_activity — this tool specifically handles pipeline addition with the correct activity type.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  inputSchema: {
    type: "object",
    properties: {
      job_id: { type: "string", description: "The job ID (required)." },
      person_id: { type: "string", description: "The candidate's person ID (required)." },
      notes: { type: "string", description: "Optional notes about why the candidate was added." },
    },
    required: ["job_id", "person_id"],
  },
},
```

- [ ] **Step 5: Replace handler**

In `src/server.ts`, replace the `loxo_apply_to_job` case (lines 1580-1599):

```typescript
case "loxo_add_to_pipeline": {
  const { job_id, person_id, notes } = AddToPipelineSchema.parse(args);

  const formData = new URLSearchParams();
  formData.append('person_event[person_id]', person_id);
  formData.append('person_event[job_id]', job_id);
  formData.append('person_event[activity_type_id]', '1550055'); // "Added to Job"
  if (notes) formData.append('person_event[notes]', notes);

  const response = await makeRequest(
    `/${env.LOXO_AGENCY_SLUG}/person_events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }
  );
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}
```

- [ ] **Step 6: Update `loxo_log_activity` description to document pipeline relationship**

In `src/server.ts`, find the `loxo_log_activity` tool definition (search for `name: "loxo_log_activity"`) and update its description to add the pipeline note:

```typescript
description: "Log a completed activity (call, email, interview) that already happened. Uses current timestamp automatically. Use loxo_get_activity_types first to get correct activity_type_id. Example: Just finished phone screen with candidate - log it with activity_type_id for 'phone screen', person_id, and notes about the conversation. Optionally link to job_id or company_id. Note: activity_type_id=1550055 ('Added to Job') adds candidates to a job pipeline — for that, prefer loxo_add_to_pipeline which handles the correct type automatically.",
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_add_to_pipeline"`
Expected: PASS (all 3 tests)

- [ ] **Step 8: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "fix: replace loxo_apply_to_job with loxo_add_to_pipeline

The old tool used POST /jobs/{id}/contacts which adds company contacts
(hiring manager, billing), NOT pipeline candidates. The new tool uses
POST /person_events with activity_type_id=1550055 ('Added to Job')
which is how Loxo internally adds candidates to job pipelines."
```

---

## Chunk 4: New reference-data tools

### Task 4: Add loxo_list_person_types, loxo_list_source_types, loxo_list_skillsets

**Files:**
- Modify: `src/server.ts` (tool definitions in ListTools + handler cases)
- Modify: `tests/handlers.test.ts`

- [ ] **Step 1: Write tests for all 3 reference-data tools**

In `tests/handlers.test.ts`, add **inside** the outer `describe('Loxo MCP tool handlers', ...)` block, after the `loxo_log_activity` describe block (before the closing `});` at line 287):

```typescript
// ─── loxo_list_person_types ─────────────────────────────────────────────

describe('loxo_list_person_types', () => {
  it('returns person types list', async () => {
    mockFetch([
      { id: 80073, name: 'Active Candidate' },
      { id: 78122, name: 'Prospect Candidate' },
    ]);
    const result = await callTool(client, 'loxo_list_person_types', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Active Candidate');
    expect(result.content[0].text).toContain('Prospect Candidate');
  });
});

// ─── loxo_list_source_types ─────────────────────────────────────────────

describe('loxo_list_source_types', () => {
  it('returns source types list', async () => {
    mockFetch({ source_types: [
      { id: 1206583, name: 'LinkedIn', active: true },
      { id: 1206592, name: 'API', active: true },
    ]});
    const result = await callTool(client, 'loxo_list_source_types', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('LinkedIn');
    expect(result.content[0].text).toContain('API');
  });
});

// ─── loxo_list_skillsets ────────────────────────────────────────────────

describe('loxo_list_skillsets', () => {
  it('returns skillset and sector hierarchies', async () => {
    // This tool makes 2 parallel requests to dynamic_fields
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      let data: unknown;
      if (url.includes('2602521')) {
        data = { id: 2602521, name: 'Skillset', hierarchies: [
          { id: 5704030, name: 'Debt Advisory', hierarchies: [] },
          { id: 5690346, name: 'M&A/Lead Advisory', hierarchies: [] },
        ]};
      } else {
        data = { id: 2602522, name: 'Sector Experience', hierarchies: [
          { id: 5690362, name: 'TMT', hierarchies: [] },
          { id: 5690364, name: 'Financial Services', hierarchies: [] },
        ]};
      }
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify(data)),
      });
    }));
    const result = await callTool(client, 'loxo_list_skillsets', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Debt Advisory');
    expect(result.content[0].text).toContain('TMT');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_list_person_types|loxo_list_source_types|loxo_list_skillsets"`
Expected: FAIL — tools don't exist

- [ ] **Step 3: Add tool definitions to ListToolsRequestSchema**

In `src/server.ts`, add these 3 tool definitions inside the `tools` array in the `ListToolsRequestSchema` handler (before the closing `]` around line 1028):

```typescript
{
  name: "loxo_list_person_types",
  description: "List all person type options (e.g. Active Candidate, Prospect Candidate). Use to discover valid person_type_id values before calling loxo_update_candidate.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  inputSchema: { type: "object", properties: {}, required: [] },
},
{
  name: "loxo_list_source_types",
  description: "List all candidate source types (e.g. LinkedIn, API, Manual, Referral). Use to discover valid source_type_id values before calling loxo_create_candidate or loxo_update_candidate.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  inputSchema: { type: "object", properties: {}, required: [] },
},
{
  name: "loxo_list_skillsets",
  description: "List all Skillset and Sector Experience hierarchy options with their IDs. Returns two sections: 'skillsets' (e.g. Debt Advisory, M&A/Lead Advisory, Transaction Services) and 'sectors' (e.g. TMT, Financial Services, Healthcare). Use the IDs with loxo_update_candidate's skillset_ids and sector_ids parameters.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  inputSchema: { type: "object", properties: {}, required: [] },
},
```

- [ ] **Step 4: Add handler cases**

In `src/server.ts`, add these cases in the `CallToolRequestSchema` switch, before the `default:` case:

```typescript
case "loxo_list_person_types": {
  const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/person_types`);
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}

case "loxo_list_source_types": {
  const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/source_types`);
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}

case "loxo_list_skillsets": {
  const [skillsetResult, sectorResult] = await Promise.all([
    makeRequest<any>(`/${env.LOXO_AGENCY_SLUG}/dynamic_fields/2602521`),
    makeRequest<any>(`/${env.LOXO_AGENCY_SLUG}/dynamic_fields/2602522`),
  ]);

  const response = {
    skillsets: (skillsetResult?.hierarchies || []).map((h: any) => ({ id: h.id, name: h.name })),
    sectors: (sectorResult?.hierarchies || []).map((h: any) => ({ id: h.id, name: h.name })),
  };
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_list_person_types|loxo_list_source_types|loxo_list_skillsets"`
Expected: PASS (all 3)

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_list_person_types, loxo_list_source_types, loxo_list_skillsets

Reference-data tools so Claude can discover valid IDs before creating
or updating candidates. Skillsets tool returns both Skillset and Sector
hierarchies from Loxo's dynamic_fields endpoint."
```

---

## Chunk 5: New tool `loxo_upload_resume`

### Task 5: Add resume upload via multipart form

**Files:**
- Modify: `src/server.ts` (tool definition + handler)
- Modify: `tests/handlers.test.ts`

- [ ] **Step 1: Write failing test**

In `tests/handlers.test.ts`, add **inside** the outer `describe('Loxo MCP tool handlers', ...)` block (before the closing `});` at the end of the file):

```typescript
// ─── loxo_upload_resume ─────────────────────────────────────────────────

describe('loxo_upload_resume', () => {
  it('uploads resume to /people/{id}/resumes endpoint', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts: any) => {
      capturedUrl = url;
      capturedBody = opts?.body;
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({
          id: 12345, name: 'cv.pdf', person_id: 42, created_at: '2026-03-16T12:00:00Z'
        })),
      });
    }));
    const result = await callTool(client, 'loxo_upload_resume', {
      person_id: '42',
      file_name: 'cv.pdf',
      file_content_base64: Buffer.from('fake pdf content').toString('base64'),
    });
    expect(result.isError).toBeFalsy();
    expect(capturedUrl).toContain('/people/42/resumes');
    // Body should be FormData (not URLSearchParams)
    expect(capturedBody).toBeInstanceOf(FormData);
    expect(result.content[0].text).toContain('cv.pdf');
  });

  it('returns error when person_id is missing', async () => {
    const result = await callTool(client, 'loxo_upload_resume', {
      file_name: 'cv.pdf',
      file_content_base64: Buffer.from('content').toString('base64'),
    });
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_upload_resume"`
Expected: FAIL — tool doesn't exist

- [ ] **Step 3: Add Zod schema**

In `src/server.ts`, after the `AddToPipelineSchema`:

```typescript
const UploadResumeSchema = z.object({
  person_id: z.string().regex(/^\d+$/, "person_id must be numeric").describe("The candidate's person ID."),
  file_name: z.string().describe("File name including extension (e.g. 'john-smith-cv.pdf')."),
  file_content_base64: z.string().describe("Base64-encoded file content."),
});
```

- [ ] **Step 4: Add tool definition**

In `src/server.ts`, add to the tools array in ListToolsRequestSchema:

```typescript
{
  name: "loxo_upload_resume",
  description: "Upload a CV/resume file to a candidate's Loxo profile. The file appears in the 'Resumes' section of their record. Accepts base64-encoded file content. Use after creating a candidate to attach their original CV. Example: Parse a CV, create the candidate with loxo_create_candidate, then upload the original file here.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  inputSchema: {
    type: "object",
    properties: {
      person_id: { type: "string", description: "The candidate's person ID (required)." },
      file_name: { type: "string", description: "File name with extension, e.g. 'john-smith-cv.pdf' (required)." },
      file_content_base64: { type: "string", description: "Base64-encoded file content (required)." },
    },
    required: ["person_id", "file_name", "file_content_base64"],
  },
},
```

- [ ] **Step 5: Add handler**

In `src/server.ts`, add case before `default:`:

```typescript
case "loxo_upload_resume": {
  const { person_id, file_name, file_content_base64 } = UploadResumeSchema.parse(args);

  requireNumericId(person_id, 'person_id');

  const fileBuffer = Buffer.from(file_content_base64, 'base64');
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append('document', blob, file_name);

  const response = await makeRequest(
    `/${env.LOXO_AGENCY_SLUG}/people/${person_id}/resumes`,
    {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
    }
  );
  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
  };
}
```

Note: `makeRequest` (line 291) does NOT set a default `Content-Type` — it only sets `accept` and `authorization`. So the FormData approach works as-is; `fetch` auto-sets the multipart boundary.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/handlers.test.ts -t "loxo_upload_resume"`
Expected: PASS (both tests)

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/server.ts tests/handlers.test.ts
git commit -m "feat: add loxo_upload_resume for CV/resume file upload

Uses POST /people/{id}/resumes with multipart FormData.
Accepts base64-encoded file content and uploads as the 'document' field.
File appears in the Resumes section of the candidate's Loxo profile."
```

---

## Chunk 6: Version bump, lint, final verification

### Task 6: Bump version and run full CI checks

**Files:**
- Modify: `package.json:3` (version)

- [ ] **Step 1: Bump version in package.json**

In `package.json`, change line 3:
```json
"version": "1.4.0",
```

- [ ] **Step 2: Run lint**

Run: `npx eslint src`
Expected: No errors (warnings for `no-explicit-any` are acceptable — see tech debt item #5)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Clean compile, no errors

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (should be 7 original + ~10 new/updated = ~17+ tests)

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 1.4.0"
```

- [ ] **Step 6: Tag the release on main**

After the PR is merged to main (or if working directly on main):

```bash
git tag v1.4.0
git push origin v1.4.0
```

This is an open-source repo — tags are how users pin to a specific version in their MCP config.

---

## Post-Implementation Notes

### Breaking change: `loxo_apply_to_job` → `loxo_add_to_pipeline`

The tool was renamed. Any Claude Desktop MCP config or saved prompts that reference `loxo_apply_to_job` will need updating. Since the old tool was fundamentally broken (it never added candidates to pipelines), this is a necessary break.

### Tags workflow for Claude

When creating candidates with tags, Claude should use this 2-step pattern:
1. `loxo_create_candidate` — creates the person with name/email/phone/title/company
2. `loxo_update_candidate` — sets tags, skillsets, sector, person type

### Dynamic field IDs are agency-specific

The hierarchy IDs (e.g. 5704030 = Debt Advisory), person type IDs (e.g. 80073 = Active Candidate), and the `activity_type_id=1550055` ("Added to Job") hardcoded in `loxo_add_to_pipeline` are all specific to the Spark Search Loxo agency. If the MCP server is used with a different Loxo agency, these IDs will differ. The `loxo_list_skillsets`, `loxo_list_person_types`, and `loxo_get_activity_types` tools exist precisely so Claude discovers them at runtime. The hardcoded pipeline activity type ID may need to be looked up dynamically in a future version.

### Fields confirmed read-only via API

- `skillsets` (text field on person) — auto-populated, not writable. Use `custom_hierarchy_1` instead.
- `source_type` — writable via `person[source_type_id]` on PUT, but NOT on POST create (auto-set to "API").

### Test candidates in production

Two test candidates exist from the API probes:
- ID 244942759: "TEST - API Probe (Delete Me)"
- ID 244945930: "TEST - Create Probe 3"

These should be cleaned up manually in the Loxo UI.
