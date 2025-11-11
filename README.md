# Loxo MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with the Loxo recruitment platform API (v1.3.1). This server enables AI assistants to perform various recruitment-related tasks such as managing candidates, jobs, companies, and activities.

## Installation

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

## Usage Examples

Once configured, you can interact with the Loxo MCP server through natural language conversations with Claude. Here are some example interactions:

### Finding Candidates

**You:** "Find me candidates who have worked at Google and know TypeScript"

**Claude will:**
1. Use `search-candidates` with query: `job_profiles.company_name:"Google" AND skillsets:"TypeScript"`
2. Return a list of matching candidates with their current roles, locations, **skills, and tags visible in search results** (no need to fetch full profiles for basic filtering)

---

**You:** "Give me all candidates in deal advisory, transaction services, or transaction advisory with financial due diligence skills at director level"

**Claude will:**
1. Use `search-candidates` with complex query: `(current_title:("Deal Advisory" OR "Transaction Services" OR "Transaction Advisory")) AND current_title:"Director" AND skillsets:"financial due diligence"`
2. Return comprehensive results (100 per page by default) with skills visible
3. Filter and present matching candidates in a single response

---

**You:** "Show me more details about candidate ID 12345"

**Claude will:**
1. Use `get-candidate` to retrieve full profile
2. Display comprehensive information including job history, education, contact details, and skills

---

**You:** "Get the complete work history for candidate 12345"

**Claude will:**
1. Use `list-person-job-profiles` to get all job entries
2. Optionally use `get-person-job-profile-detail` for each entry to show full details

---

### Advanced Search Techniques

The `search-candidates` tool supports complex Lucene queries for precise candidate filtering.

**IMPORTANT - Field Name Mapping:**
- Queries use `skills` (search index): `query='skills:"Python"'`
- Responses return `skillsets` (API field): `{skillsets: "Python, JavaScript"}`

**Multiple Role Types with Skills:**
```
query='(current_title:("Deal Advisory" OR "Transaction Services" OR "Transaction Advisory")) 
       AND current_title:"Director" 
       AND skills:"financial due diligence"'
```

**Past Companies with Multiple Skills:**
```
query='(job_profiles.company_name:("KPMG" OR "Deloitte" OR "PwC" OR "EY")) 
       AND skills:("M&A" OR "financial due diligence")'
```

**Combined Current and Past Experience:**
```
query='current_title:"Director" 
       AND job_profiles.company_name:("Big 4") 
       AND skills:"financial modeling"'
```

**Using Tags:**
```
query='all_raw_tags:"key account" AND current_title:"VP"'
```

**Data Quality - Finding Missing Fields:**
```
# Candidates without skills
query='NOT _exists_:skills'

# Candidates without tags  
query='NOT _exists_:all_raw_tags'

# Candidates missing location
query='NOT _exists_:location'
```

**Benefits:**
- Returns **100 results per page** (vs 20 previously) for fewer API calls
- **Skillsets and tags visible in search results** - no need to fetch full profiles for filtering
- Construct comprehensive queries upfront to get all relevant candidates in 1-2 API calls instead of 10+
- Use `NOT _exists_:` to find incomplete profiles for data cleanup

---

### Managing Activities

**You:** "What are my tasks for today?"

**Claude will:**
1. Use `get-todays-tasks` with today's date range
2. Show all scheduled activities and tasks

---

**You:** "Schedule a follow-up call with candidate 12345 for next Tuesday at 2pm"

**Claude will:**
1. Use `get-activity-types` to find the call activity type ID
2. Use `schedule-activity` with the candidate ID, activity type, and the specified date/time
3. Confirm the activity was scheduled

---

**You:** "Log that I just had a phone screen with candidate 12345. They were great, very strong React skills."

**Claude will:**
1. Use `get-activity-types` to find phone screen activity type ID
2. Use `log-activity` with the candidate ID, activity type, and your notes
3. Confirm the activity was logged

---

### Searching Jobs

**You:** "Find all remote Senior Engineer positions"

**Claude will:**
1. Use `search-jobs` with query containing title and location filters
2. Display matching jobs with key details

---

**You:** "Show me details for job 54321"

**Claude will:**
1. Use `get-job` to retrieve full job posting
2. Display complete job information including description, requirements, and status

---

### Working with Companies

**You:** "Find all companies with 'Tech' in their name"

**Claude will:**
1. Use `search-companies` with query: `name:"Tech*"`
2. Return list of matching companies

---

**You:** "Get details for company 98765"

**Claude will:**
1. Use `get-company-details` to retrieve company information
2. Display company profile including contacts and relationships

---

### Getting Contact Information

**You:** "What email addresses do we have for candidate 12345?"

**Claude will:**
1. Use `get-person-emails` to retrieve all email addresses
2. Display the email addresses with their types

---

**You:** "Get phone numbers for candidate 12345"

**Claude will:**
1. Use `get-person-phones` to retrieve all phone numbers
2. Display phone numbers with their types

---

### Reference Data

**You:** "What activity types are available in Loxo?"

**Claude will:**
1. Use `get-activity-types` to retrieve the list
2. Display all available activity types with their IDs

---

**You:** "Who are the users in our agency?"

**Claude will:**
1. Use `list-users` to get agency users
2. Display user list with names and emails

---

## Available Tools

The server provides the following tools for AI assistants:

### Activity & Event Management
- `get-activity-types` - List available activity types
- `get-todays-tasks` - Get scheduled items (supports date filtering)
- `schedule-activity` - Create future person events
- `log-activity` - Log completed person events

### Candidate/People Management
- `search-candidates` - Search using Lucene syntax with complex multi-criteria queries (scroll_id pagination, returns skillsets and tags in results, 100 results per page default)
- `get-candidate` - Get full candidate profile
- `get-person-emails` - Get all email addresses
- `get-person-phones` - Get all phone numbers
- `list-person-job-profiles` - List work history
- `get-person-job-profile-detail` - Get specific job details
- `list-person-education-profiles` - List education history
- `get-person-education-profile-detail` - Get specific education details

### Job Management
- `search-jobs` - Search jobs (page-based pagination)
- `get-job` - Get full job details

### Company Management
- `search-companies` - Search companies (scroll_id pagination)
- `get-company-details` - Get company profile

### User Management
- `list-users` - List agency users

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

## Type Safety

The server uses Zod for runtime type validation of:
- Environment variables
- Tool input parameters
- API responses

## Error Handling

The server includes comprehensive error handling for:
- Environment validation
- API request failures
- Invalid tool parameters
- Unknown tool requests

## Architecture

- Built using the Model Context Protocol SDK
- Communicates over stdio for seamless integration with AI assistants
- Uses TypeScript for type safety and better developer experience
- Implements RESTful API calls to Loxo's platform (API v1.3.1)
- All endpoints verified against official Loxo OpenAPI specification

## Implementation Notes

### Recent Changes
- **Removed non-existent endpoints:** Tools for `spark-search-activity-types`, `get-call-queue`, `add-to-call-queue`, and `add-note` have been removed as these endpoints don't exist in the Loxo API
- **Fixed activity endpoints:** `schedule-activity` and `log-activity` now correctly use the `/person_events` endpoint
- **Fixed tasks endpoint:** `get-todays-tasks` now uses `/schedule_items` endpoint
- **Fixed jobs search:** Now uses correct `/jobs` endpoint with page-based pagination (not scroll_id)

### Pagination
- **People/Companies/Events:** Use `scroll_id` cursor-based pagination
- **Jobs:** Use `page` and `per_page` offset-based pagination

### Activity/Event System
Activities in Loxo are managed through the `person_events` API:
- Scheduled activities use `created_at` with a future timestamp
- Logged activities use current timestamp (no `created_at` parameter)
- Events can be associated with a person, job, and/or company

### API Request Format
Most POST/PUT requests use `application/x-www-form-urlencoded` with field names in bracket notation:
- Example: `person_event[activity_type_id]=3`
- Example: `person_event[notes]=Great candidate`
