[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/tbensonwest-loxo-mcp-server-badge.png)](https://mseep.ai/app/tbensonwest-loxo-mcp-server)

# Loxo MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with the Loxo recruitment platform API. This server enables AI assistants to perform various recruitment-related tasks such as managing candidates, jobs, activities, and call queues.

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd loxo-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
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

## Available Tools

### Activity Management
- `get-activity-types`: Retrieve list of available activity types
- `spark-search-activity-types`: Get activity types from Spark Search
- `get-todays-tasks`: Get all tasks and scheduled activities for today
- `schedule-activity`: Schedule a future activity (call, meeting, etc.)
- `log-activity`: Log an activity for a candidate or job

### Call Queue Management
- `get-call-queue`: View the current call queue
- `add-to-call-queue`: Add a candidate or contact to the call queue

### Candidate Management
- `search-candidates`: Search for candidates in Loxo
- `get-candidate`: Get detailed information about a specific candidate
- `add-note`: Add a note to a candidate

### Job Management
- `search-jobs`: Search for jobs in Loxo
- `get-job`: Get detailed information about a specific job
- `add-note`: Add a note to a job

## Development

```bash
# Run in development mode with watch mode
npm run dev

# Build the project
npm run build

# Start the server
npm start
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
- Implements RESTful API calls to Loxo's platform
