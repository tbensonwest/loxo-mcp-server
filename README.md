[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/tbensonwest-loxo-mcp-server-badge.png)](https://mseep.ai/app/tbensonwest-loxo-mcp-server)
![CI](https://github.com/tbensonwest/loxo-mcp-server/actions/workflows/ci.yml/badge.svg)

# Loxo MCP Server

**📚 Documentation:** https://tbensonwest.github.io/loxo-mcp-server/

A Model Context Protocol (MCP) server that gives Claude direct access to the Loxo recruitment platform. Version 1.7.0 provides 34 tools covering the full recruiter workflow: searching and researching candidates, managing job pipelines, tracking activity and communication, working with companies, and maintaining candidate records. Tool descriptions guide Claude to surface recruiter intake notes and intel-rich activity history — so it can answer "where did we leave things with this candidate?" without you having to dig.

<a href="https://glama.ai/mcp/servers/rj00ooup46"><img width="380" height="200" src="https://glama.ai/mcp/servers/rj00ooup46/badge" alt="Loxo Server MCP server" /></a>

## Installation

### Option 0: Install via Smithery (easiest)

Install automatically for Claude Desktop via [Smithery](https://smithery.ai/server/loxo-mcp-server):

```bash
npx -y @smithery/cli install loxo-mcp-server --client claude
```

[![smithery badge](https://smithery.ai/badge/loxo-mcp-server)](https://smithery.ai/server/loxo-mcp-server)

### Option 1: Local Installation

```bash
# Clone the repository
git clone [repository-url]
cd loxo-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Option 2: Docker Installation

```bash
# Clone the repository
git clone [repository-url]
cd loxo-mcp-server

# Build the Docker image
docker build -t loxo-mcp-server .

# Or use Docker Compose
docker-compose build
```

## Configuration

Copy the provided `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then update the `.env` file with your configuration:

```env
LOXO_API_KEY=your_api_key
LOXO_DOMAIN=app.loxo.co
LOXO_AGENCY_SLUG=your_agency_slug
```

Required environment variables:
- `LOXO_API_KEY`: Your Loxo API key
- `LOXO_AGENCY_SLUG`: Your agency's slug in Loxo
- `LOXO_DOMAIN`: (Optional) Defaults to 'app.loxo.co'
- `LOXO_DEFAULT_OWNER_ID`: (Optional) Default Loxo user ID to set as `owned_by_id` on candidates created or updated via this server. Find your ID via `loxo_list_users`. Falls back to no owner if not set; overridden per-call by the `owned_by_id` arg.
- `LOXO_DEFAULT_OWNER_EMAIL`: (Optional) Default email for deal ownership. Used by `loxo_create_deal` when no `owner_email` arg is provided. Find emails via `loxo_list_users`.

### Docker Configuration

When using Docker, environment variables are automatically loaded from your `.env` file via Docker Compose, or can be passed directly:

**Using Docker Compose** (recommended):
```bash
# Ensure your .env file is configured
docker-compose up
```

**Using Docker directly**:
```bash
docker run -i \
  -e LOXO_API_KEY=your_api_key \
  -e LOXO_AGENCY_SLUG=your_agency_slug \
  -e LOXO_DOMAIN=app.loxo.co \
  loxo-mcp-server
```

**Note**: The `-i` flag is required because MCP servers communicate over stdin/stdout.

## Usage

### Running the Server

**Locally**:
```bash
npm start
```

**With Docker Compose**:
```bash
docker-compose up
```

**With Docker directly**:
```bash
docker run -i \
  -e LOXO_API_KEY=your_api_key \
  -e LOXO_AGENCY_SLUG=your_agency_slug \
  loxo-mcp-server
```

### Integrating with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

**Local installation**:
```json
{
  "mcpServers": {
    "loxo": {
      "command": "node",
      "args": ["/path/to/loxo-mcp-server/build/index.js"],
      "env": {
        "LOXO_API_KEY": "your_api_key",
        "LOXO_AGENCY_SLUG": "your_agency_slug",
        "LOXO_DOMAIN": "app.loxo.co"
      }
    }
  }
}
```

**Docker installation**:
```json
{
  "mcpServers": {
    "loxo": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "LOXO_API_KEY=your_api_key",
        "-e", "LOXO_AGENCY_SLUG=your_agency_slug",
        "-e", "LOXO_DOMAIN=app.loxo.co",
        "loxo-mcp-server"
      ]
    }
  }
}
```

## Workflow Examples

### Preparing a client briefing pack

"Prepare a briefing pack for the Northvale role."

1. `loxo_search_jobs` — find the Northvale job and get its ID
2. `loxo_get_job_pipeline` — get all candidates and their current stage
3. `loxo_get_candidate_brief` (per candidate) — pull intake notes, contact details, and recent intel-rich activities in one call
4. Compile into a structured briefing document with current stage, motivations, compensation expectations, and recent touchpoints

---

### Pipeline status update

"Give me a status update on all active candidates."

1. `loxo_get_job_pipeline` — retrieve all candidates on the role with their stage
2. `loxo_get_candidate_brief` (per candidate) — get intake notes and recent activity to summarise where each conversation stands
3. Deliver a concise status summary: stage, last contact, next step

---

### Matching candidates to a new role

"Who from our database would suit this new CFO role?"

1. `loxo_search_candidates` — search by title, skills, sector, and tags using Lucene queries
2. `loxo_get_candidate_brief` (for shortlisted candidates) — review intake notes and activity history to assess genuine fit and current availability
3. Surface the best matches with supporting evidence from recruiter notes and recent conversations

## Available Tools

### Find & Research Candidates

- **`loxo_search_candidates`** — Search the candidate database using Lucene queries. Filter by current title, past employers, skills, tags, location, or any combination. Returns 100 results per page including skillsets and tags, so you can filter without extra calls. Follow up with `loxo_get_candidate_brief` for shortlisted candidates.
- **`loxo_get_candidate`** — Full candidate profile including bio, current role, skills, tags, compensation, and the recruiter's intake and call notes (in the `description` field). The `description` field is often the richest source of candidate intelligence: motivations, personal circumstances, compensation expectations, and role preferences.
- **`loxo_get_candidate_brief`** — The go-to tool when you need full candidate context. Returns profile (including intake notes), all contact details, and recent intel-rich activities (calls, emails, notes, interviews — with pipeline noise filtered out) in a single call. Use this before drafting outreach, preparing briefing packs, or evaluating candidate-role fit. Supports pagination via `scroll_id` to dig back into older activity.
- **`loxo_get_person_emails`** — All email addresses on file for a candidate, with type labels (work, personal, etc.).
- **`loxo_get_person_phones`** — All phone numbers on file for a candidate, with type labels (mobile, work, home, etc.).
- **`loxo_list_person_job_profiles`** — Complete work history list for a candidate: all roles, companies, and dates.
- **`loxo_get_person_job_profile_detail`** — Detailed information about a specific role in a candidate's work history. Use after `loxo_list_person_job_profiles` when you need the full description for a particular position.
- **`loxo_list_person_education_profiles`** — Complete education history for a candidate: all degrees, schools, and dates.
- **`loxo_get_person_education_profile_detail`** — Detailed information about a specific education entry. Use after `loxo_list_person_education_profiles` when you need the full details for a particular qualification.

### Manage Pipeline & Jobs

- **`loxo_search_jobs`** — Search open roles using Lucene queries (title, location, or any combination). Uses page-based pagination.
- **`loxo_get_job`** — Full job details including description, requirements, compensation, status, and hiring team.
- **`loxo_get_job_pipeline`** — All candidates currently on a job with their pipeline stage (sourced, screened, interviewing, offer, placed). Returns candidate IDs and stages; follow up with `loxo_get_candidate_brief` for full context on each person.
- **`loxo_add_to_pipeline`** — Add a candidate to a job's pipeline. Places them at the first stage and makes them visible in `loxo_get_job_pipeline`.

### Deals & BD Pipeline

- **`loxo_list_deal_workflows`** — List all deal workflows (pipelines) with IDs and names. Use to discover which pipelines exist before searching or creating deals.
- **`loxo_get_deal_workflow`** — Get a deal workflow's details including pipeline stages. Use to find valid `pipeline_stage_id` values for `loxo_create_deal`.
- **`loxo_search_deals`** — Search deals with optional Lucene query and owner email filter. Uses cursor-based pagination with `scroll_id`.
- **`loxo_get_deal`** — Full deal details including name, amount, close date, pipeline stage, and linked company/person/job.
- **`loxo_create_deal`** — Create a new deal in a pipeline. Requires name, amount, close date, workflow ID, and pipeline stage ID. Owner email falls back to `LOXO_DEFAULT_OWNER_EMAIL`.
- **`loxo_log_deal_activity`** — Log an activity on a deal. Use `loxo_get_activity_types` with the deal's `workflow_id` to find deal-specific activity type IDs.

### Track Activity & Communication

- **`loxo_get_candidate_activities`** — Full activity timeline for a candidate: all calls, emails, meetings, notes, pipeline moves, and automation events, most recent first. Optionally filter by `activity_type_ids` (use `loxo_get_activity_types` to discover IDs). For a cleaner, intel-focused view, use `loxo_get_candidate_brief` instead.
- **`loxo_log_activity`** — Record a completed activity (call, email, meeting, interview) against a candidate. Use `loxo_get_activity_types` first to find the correct activity type ID.
- **`loxo_schedule_activity`** — Create a future activity (call, meeting, interview) for a candidate. Use `loxo_get_activity_types` first to find the correct activity type ID.
- **`loxo_get_todays_tasks`** — All scheduled items for today (or a date range you specify). Optionally filter by user.
- **`loxo_get_activity_types`** — List all activity types and their IDs. Optionally pass a `workflow_id` to get deal-specific activity types instead of candidate types. Call this before logging or scheduling activities.

### Companies & Reference Data

- **`loxo_create_company`** — Create a new company (client/target account). Currently accepts only `name`.
- **`loxo_search_companies`** — Search the company database using Lucene queries. Uses cursor-based pagination with `scroll_id`.
- **`loxo_get_company_details`** — Full company profile including description, contacts, relationships, and status.
- **`loxo_list_users`** — All users in your Loxo agency (recruiters, coordinators, etc.) with names and emails. Use to find `user_id` values for filtering tasks or checking record ownership.
- **`loxo_list_skillsets`** — All Skillset and Sector Experience options with their IDs. Use to find valid `skillset_ids` and `sector_ids` values before calling `loxo_update_candidate`.
- **`loxo_list_source_types`** — All candidate source types (LinkedIn, API, Referral, etc.) with their IDs. Use to find valid `source_type_id` values.
- **`loxo_list_person_types`** — All person type categories (Active Candidate, Prospect Candidate, etc.) with their IDs. Use to find valid `person_type_id` values.

### Candidate Management

- **`loxo_create_candidate`** — Create a new candidate record with name, contact info, and current role. After creating, use `loxo_update_candidate` to set tags, skillsets, person type, and source type.
- **`loxo_update_candidate`** — Update an existing candidate's details: profile fields, tags, skillsets, sector, person type, and source type. Use `loxo_list_skillsets` and `loxo_list_person_types` to look up valid IDs first.
- **`loxo_upload_resume`** — Upload a CV or resume file to a candidate's profile. Accepts base64-encoded file content. The file appears in the Resumes section of their Loxo record.

## Architecture

Built on the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk), communicating over stdio for seamless integration with Claude Desktop and Claude.ai.

- **v1.7.0** — 34 tools; tool descriptions guide Claude to surface recruiter intake notes (`description` field) and intel-rich activities (calls, emails, notes, interviews) while filtering out pipeline automation noise
- All API calls go to `https://{LOXO_DOMAIN}/api/{LOXO_AGENCY_SLUG}/...` with Bearer token auth
- POST/PATCH request bodies use `application/x-www-form-urlencoded` with bracket notation (e.g. `person[name]`)
- All endpoints verified against the official Loxo OpenAPI specification

### Pagination

Two pagination styles are used depending on the endpoint:

- **Cursor-based (`scroll_id`)** — used by candidates, companies, deals, schedule items, and activities. Pass the `scroll_id` from one response to the next to walk through pages.
- **Page-based (`page` / `per_page`)** — used by jobs. Pass `page=1`, `page=2`, etc.

### Activity & Event System

All activity tracking (calls, emails, meetings, notes, pipeline moves) goes through the `person_events` API:

- **Scheduled activities** — use `loxo_schedule_activity` with a future `created_at` datetime
- **Completed activities** — use `loxo_log_activity`; the current timestamp is applied automatically
- Activities can be linked to a person, a job, and/or a company
- `loxo_get_candidate_brief` filters activities to intel-rich types only (excludes pipeline automation events and other low-signal entries)

## Development

### Local Development

```bash
# Run in development mode with watch mode
npm run dev

# Build the project
npm run build

# Start the server
npm start
```

### Docker Development

```bash
# Rebuild after code changes
docker-compose build

# Run with live logs
docker-compose up

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```
