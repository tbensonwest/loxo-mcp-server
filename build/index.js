import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { validateEnv } from './config.js';
// Load and validate environment variables
const env = validateEnv();
// Construct API base URL using domain from config
const LOXO_API_BASE = `https://${env.LOXO_DOMAIN}/api`;
// MCP Best Practice: Character limit for responses to prevent overwhelming context
const CHARACTER_LIMIT = 25000;
// Helper function to truncate responses with clear messaging
function truncateResponse(content, limit = CHARACTER_LIMIT) {
    if (content.length <= limit) {
        return { text: content, wasTruncated: false };
    }
    const truncated = content.substring(0, limit);
    const message = `\n\n[Response truncated at ${limit} characters. Original length: ${content.length} characters. Use filtering parameters to reduce result size.]`;
    return {
        text: truncated + message,
        wasTruncated: true
    };
}
// Helper function to format responses based on format preference
function formatResponse(data, format = 'json') {
    if (format === 'markdown') {
        // For now, return JSON wrapped in markdown code block
        // Future enhancement: convert to proper markdown tables/lists
        return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    }
    return JSON.stringify(data, null, 2);
}
// Helper function to create actionable error messages
function formatApiError(status, statusText, responseBody, endpoint) {
    switch (status) {
        case 401:
            return `Authentication failed: Invalid or expired API key.\n\nNext steps:\n1. Verify your LOXO_API_KEY in .env is correct\n2. Check if your API key has expired in Loxo settings\n3. Ensure you have API access enabled for your account`;
        case 403:
            return `Access forbidden: You don't have permission to access this resource.\n\nNext steps:\n1. Verify your API key has the required permissions\n2. Check if this endpoint requires specific user roles\n3. Contact your Loxo administrator if you need elevated access`;
        case 404:
            const idMatch = endpoint.match(/\/(\d+|[a-f0-9-]{36})(?:\/|$)/);
            const id = idMatch ? idMatch[1] : 'specified';
            return `Resource not found: The ${id} ID does not exist.\n\nNext steps:\n1. Verify the ID is correct\n2. Check if the resource was deleted\n3. Use search tools to find the correct ID`;
        case 422:
            return `Invalid request: The provided data is invalid.\n\nDetails: ${responseBody}\n\nNext steps:\n1. Check required fields are provided\n2. Verify field formats (dates as ISO strings, IDs as strings/integers)\n3. Review tool parameter requirements`;
        case 429:
            return `Rate limit exceeded: Too many requests.\n\nNext steps:\n1. Wait a few moments before retrying\n2. Reduce request frequency\n3. Contact Loxo support to increase your rate limit`;
        case 500:
        case 502:
        case 503:
            return `Loxo API server error (${status}): The Loxo service is experiencing issues.\n\nNext steps:\n1. Wait a few minutes and retry\n2. Check Loxo service status\n3. If issue persists, contact Loxo support`;
        default:
            return `API request failed (${status}): ${statusText}\n\nNext steps:\n1. Review the error details above\n2. Verify your request parameters\n3. Check Loxo API documentation for this endpoint`;
    }
}
// Helper function for API calls
async function makeRequest(endpoint, options = {}) {
    const url = `${LOXO_API_BASE}${endpoint}`;
    const headers = {
        'accept': 'application/json',
        'authorization': `Bearer ${env.LOXO_API_KEY}`,
        ...options.headers
    };
    try {
        const response = await fetch(url, { ...options, headers });
        const responseText = await response.text();
        if (!response.ok) {
            console.error('API Response:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText
            });
            // Throw actionable error message
            const errorMessage = formatApiError(response.status, response.statusText, responseText, endpoint);
            throw new Error(errorMessage);
        }
        // Only try to parse as JSON if we have content
        return responseText ? JSON.parse(responseText) : null;
    }
    catch (error) {
        // If it's already our formatted error, re-throw it
        if (error instanceof Error && error.message.includes('Next steps:')) {
            throw error;
        }
        // Handle network errors and other issues
        if (error instanceof Error) {
            if (error.message.includes('fetch')) {
                throw new Error(`Network error: Unable to connect to Loxo API.\n\nNext steps:\n1. Check your internet connection\n2. Verify LOXO_DOMAIN is correct in .env (current: ${env.LOXO_DOMAIN})\n3. Check if Loxo API is accessible from your network`);
            }
            if (error.message.includes('JSON')) {
                throw new Error(`Invalid response: Loxo API returned malformed data.\n\nNext steps:\n1. Retry the request\n2. Check if the endpoint is correct\n3. Contact Loxo support if issue persists`);
            }
        }
        // Log internal details but don't expose them to user
        console.error('Unexpected error:', error);
        console.error('Request details:', {
            endpoint,
            method: options.method || 'GET',
            hasBody: !!options.body
        });
        // Generic fallback error
        throw new Error(`Unexpected error occurred.\n\nNext steps:\n1. Retry the request\n2. Check your parameters are valid\n3. Review logs for technical details`);
    }
}
// Add before the server creation
// Add after imports
const PersonEventSchema = z.object({
    person_id: z.string().optional(),
    job_id: z.string().optional(),
    company_id: z.string().optional(),
    activity_type_id: z.string(),
    notes: z.string().optional(),
    created_at: z.string().optional(), // For scheduled events, set future datetime
});
const SearchSchema = z.object({
    query: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    scroll_id: z.union([z.number(), z.string()]).optional(), // Accept both number and string
    per_page: z.number().optional().default(100)
});
// Schema specifically for search-candidates tool arguments
const SearchCandidatesSchema = z.object({
    query: z.string().optional().describe("General Lucene search query. Use for specific field searches like past companies, skills, etc."),
    company: z.string().optional().describe("Current company name to search for."),
    title: z.string().optional().describe("Current job title to search for."),
    scroll_id: z.string().optional().describe("Pagination scroll ID from previous search results."), // API expects string
    per_page: z.number().int().optional().default(100).describe("Number of results per page (default 100, max typically 100 by Loxo)."),
    person_global_status_id: z.number().int().optional().describe("Filter by person global status ID."),
    person_type_id: z.number().int().optional().describe("Filter by person type ID."),
    list_id: z.number().int().optional().describe("Filter by person list ID."),
    include_related_agencies: z.boolean().optional().describe("Include results from related agencies.")
});
// Schema for search-companies tool
const SearchCompaniesSchema = z.object({
    query: z.string().optional().describe("Search query (Lucene syntax)."),
    scroll_id: z.string().optional().describe("Cursor for pagination."),
    company_type_id: z.number().int().optional().describe("Filter by company type ID."),
    list_id: z.number().int().optional().describe("Filter by list ID."),
    company_global_status_id: z.number().int().optional().describe("Filter by company global status ID.")
});
// Schema for get-company-details tool
const GetCompanyDetailsSchema = z.object({
    company_id: z.number().int().describe("The ID of the company to retrieve.")
});
// Schema for list-users tool
const ListUsersSchema = z.object({}); // No specific input parameters
const EntityIdSchema = z.object({
    id: z.string() // Represents person_id for these tools
});
const PersonSubResourceIdSchema = z.object({
    person_id: z.string(),
    resource_id: z.string() // Represents job_profile_id or education_profile_id
});
// Create server instance
const server = new Server({
    name: "loxo-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "loxo_get_activity_types",
                description: "Get a list of all available activity types in Loxo (e.g., calls, meetings, interviews). Use this before scheduling or logging activities to find the correct activity_type_id. Example: Call this first to get activity type IDs, then use loxo_schedule_activity with the correct ID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: [],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_todays_tasks",
                description: "Get scheduled items (tasks, calls, meetings) for a date range. Uses cursor-based pagination with scroll_id. Examples: (1) Get today's tasks: omit all parameters. (2) Get tasks for specific user: provide user_id. (3) Get tasks for date range: provide start_date and end_date in ISO format (YYYY-MM-DD). Combine parameters to filter by user and date range.",
                inputSchema: {
                    type: "object",
                    properties: {
                        user_id: {
                            type: "number",
                            description: "Optional: Filter by user ID"
                        },
                        start_date: {
                            type: "string",
                            description: "Optional: Start date for filtering (ISO format)"
                        },
                        end_date: {
                            type: "string",
                            description: "Optional: End date for filtering (ISO format)"
                        },
                        per_page: {
                            type: "number",
                            description: "Number of results per page"
                        },
                        scroll_id: {
                            type: "string",
                            description: "Cursor for pagination"
                        },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: [],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_schedule_activity",
                description: "Schedule a future activity (call, meeting, interview) with a candidate. Use loxo_get_activity_types first to get the correct activity_type_id. Example: Schedule a call tomorrow at 2pm - set created_at to future ISO datetime (2024-01-15T14:00:00Z), provide person_id, activity_type_id for 'call', and notes. Optionally link to a job_id or company_id.",
                inputSchema: {
                    type: "object",
                    properties: {
                        person_id: {
                            type: "string",
                            description: "ID of the person (candidate) for this activity"
                        },
                        job_id: {
                            type: "string",
                            description: "Optional: ID of the job related to this activity"
                        },
                        company_id: {
                            type: "string",
                            description: "Optional: ID of the company related to this activity"
                        },
                        activity_type_id: {
                            type: "string",
                            description: "ID of the activity type"
                        },
                        created_at: {
                            type: "string",
                            description: "ISO datetime when the activity should occur (future date/time for scheduled activities)"
                        },
                        notes: {
                            type: "string",
                            description: "Notes about the scheduled activity"
                        }
                    },
                    required: ["activity_type_id", "created_at"]
                },
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_search_candidates",
                description: "Search for candidates using Lucene query syntax. Uses cursor-based pagination with scroll_id. Returns skillsets and tags in results for filtering without additional API calls.\n\nSIMPLE QUERY EXAMPLES:\n(1) Past employer: query='job_profiles.company_name:\"Google\"'\n(2) Skills: query='skillsets:\"Python\"'\n(3) Current role: company='Acme Corp' and title='Engineer'\n\nCOMPLEX MULTI-CRITERIA EXAMPLES:\n(4) Multiple titles with skills: query='(current_title:\"Director\" OR current_title:\"Senior Director\") AND skillsets:\"financial due diligence\"'\n(5) Multiple role types at specific level: query='(current_title:(\"Deal Advisory\" OR \"Transaction Services\" OR \"Transaction Advisory\")) AND current_title:\"Director\" AND skillsets:\"due diligence\"'\n(6) Past companies with skills: query='(job_profiles.company_name:(\"KPMG\" OR \"Deloitte\" OR \"PwC\" OR \"EY\")) AND skillsets:(\"M&A\" OR \"financial due diligence\")'\n(7) Combined current AND past: query='current_title:\"Director\" AND job_profiles.company_name:(\"Big 4\") AND skillsets:\"financial modeling\"'\n(8) Tags: query='all_raw_tags:\"key account\"'\n\nTIPS: Use OR for multiple options, AND to combine criteria, parentheses for grouping. Start with comprehensive queries to get all relevant candidates in fewer API calls.\n\nReturns: id, name, current_title, current_company, location, skillsets, all_raw_tags. Use scroll_id from pagination for next page.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "General Lucene search query. Use for specific field searches like past companies, skills, etc. (optional)"
                        },
                        company: {
                            type: "string",
                            description: "Current company name to search for (optional)"
                        },
                        title: {
                            type: "string",
                            description: "Current job title to search for (optional)"
                        },
                        scroll_id: {
                            type: "string", // OpenAPI spec says string for scroll_id
                            description: "Pagination scroll ID from previous search results."
                        },
                        per_page: {
                            type: "number",
                            description: "Number of results per page (default 100, max typically 100 by Loxo)."
                        },
                        person_global_status_id: {
                            type: "integer",
                            description: "Filter by person global status ID."
                        },
                        person_type_id: {
                            type: "integer",
                            description: "Filter by person type ID."
                        },
                        list_id: {
                            type: "integer",
                            description: "Filter by person list ID."
                        },
                        include_related_agencies: {
                            type: "boolean",
                            description: "Include results from related agencies."
                        },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    }
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_candidate",
                description: "Get complete candidate profile including bio, location, current role, skills, tags, compensation, and embedded lists of jobs/education/emails/phones. Use this for overview. For guaranteed complete contact info or work history, use dedicated tools: loxo_get_person_emails, loxo_get_person_phones, loxo_list_person_job_profiles, loxo_list_person_education_profiles. Example: After searching candidates, use their ID here to get full details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Candidate ID"
                        },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["id"]
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_person_emails",
                description: "Get all email addresses for a candidate with type information (work, personal, etc.). Use when you need guaranteed complete email list or when candidate profile doesn't include emails. Example: After finding a candidate, use their ID to get all email addresses for outreach.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "The ID of the person." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_person_phones",
                description: "Get all phone numbers for a candidate with type information (mobile, work, home, etc.). Use when you need guaranteed complete phone list or when candidate profile doesn't include phones. Example: After finding a candidate, use their ID to get all phone numbers for calling.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "The ID of the person." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_list_person_job_profiles",
                description: "Get complete work history for a candidate (all job profiles with company, title, dates, descriptions). Returns list of all positions. Use loxo_get_person_job_profile_detail for additional details of a specific position if needed. Example: After finding a candidate with Google experience, get their full work history to see all roles and tenure.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "The ID of the person." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_person_job_profile_detail",
                description: "Get detailed information about a specific position in a candidate's work history. Use after loxo_list_person_job_profiles to get additional details for a particular job. Requires both person_id and resource_id (job profile ID from list response). Example: Candidate worked at 3 companies, get details of their Google role specifically.",
                inputSchema: {
                    type: "object",
                    properties: {
                        person_id: { type: "string", description: "The ID of the person." },
                        resource_id: { type: "string", description: "The ID of the job profile." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["person_id", "resource_id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_list_person_education_profiles",
                description: "Get complete education history for a candidate (degrees, schools, graduation dates, descriptions). Returns list of all education entries. Use loxo_get_person_education_profile_detail for additional details if needed. Example: Check if candidate has required degree or attended target schools.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "The ID of the person." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_person_education_profile_detail",
                description: "Get detailed information about a specific education entry in a candidate's profile. Use after loxo_list_person_education_profiles to get additional details. Requires both person_id and resource_id (education profile ID from list response). Example: Candidate has multiple degrees, get details of their Stanford MBA specifically.",
                inputSchema: {
                    type: "object",
                    properties: {
                        person_id: { type: "string", description: "The ID of the person." },
                        resource_id: { type: "string", description: "The ID of the education profile." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["person_id", "resource_id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_search_jobs",
                description: "Search for jobs using Lucene query syntax. Uses page-based pagination (NOT scroll_id like candidates). Lucene examples: (1) Title: query='title:\"Senior Engineer\"' (2) Location: query='location:\"Remote\"' (3) Combined: query='title:\"Engineer\" AND location:\"San Francisco\"'. Use page parameter for pagination (starts at 1). Returns job listings with key details. Example: Find all remote senior positions to match with candidates.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query for jobs (Lucene syntax supported)"
                        },
                        page: {
                            type: "number",
                            description: "Page number for pagination (starting at 1)"
                        },
                        per_page: {
                            type: "number",
                            description: "Number of results per page"
                        },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    }
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_job",
                description: "Get complete job details including description, requirements, compensation, status, hiring team, and related contacts. Use after searching jobs to get full posting details. Example: After finding relevant jobs via search, get full details to assess candidate fit or share with candidate.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Job ID"
                        },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["id"]
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_log_activity",
                description: "Log a completed activity (call, email, interview) that already happened. Uses current timestamp automatically. Use loxo_get_activity_types first to get correct activity_type_id. Example: Just finished phone screen with candidate - log it with activity_type_id for 'phone screen', person_id, and notes about the conversation. Optionally link to job_id or company_id.",
                inputSchema: {
                    type: "object",
                    properties: {
                        person_id: {
                            type: "string",
                            description: "ID of the person (candidate) for this activity"
                        },
                        job_id: {
                            type: "string",
                            description: "Optional: ID of the job related to this activity"
                        },
                        company_id: {
                            type: "string",
                            description: "Optional: ID of the company related to this activity"
                        },
                        activity_type_id: {
                            type: "string",
                            description: "ID of the activity type"
                        },
                        notes: {
                            type: "string",
                            description: "Notes about the completed activity"
                        }
                    },
                    required: ["activity_type_id"]
                },
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_search_companies",
                description: "Search for companies using Lucene query syntax. Uses cursor-based pagination with scroll_id. Lucene examples: (1) Name: query='name:\"Acme*\"' (wildcard search) (2) Combine with filters: query + company_type_id or company_global_status_id. Use scroll_id from response for next page. Example: Find all tech companies in your database to source candidates from target employers.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query (Lucene syntax)." },
                        scroll_id: { type: "string", description: "Cursor for pagination." },
                        company_type_id: { type: "integer", description: "Filter by company type ID." },
                        list_id: { type: "integer", description: "Filter by list ID." },
                        company_global_status_id: { type: "integer", description: "Filter by company global status ID." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: [],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_get_company_details",
                description: "Get complete company profile including description, contacts, relationships, and status. Use after searching companies to get full details. Requires company_id (integer). Example: After finding target companies via search, get full details to understand hiring contacts and company background for candidate sourcing.",
                inputSchema: {
                    type: "object",
                    properties: {
                        company_id: { type: "integer", description: "The ID of the company to retrieve." },
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: ["company_id"],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            {
                name: "loxo_list_users",
                description: "Get all users in your Loxo agency (recruiters, coordinators, etc.) with names and emails. Use this to find user_id values for filtering scheduled tasks or assigning ownership. Example: Get all recruiters to see who owns which candidates or to filter tasks by specific team member.",
                inputSchema: {
                    type: "object",
                    properties: {
                        response_format: {
                            type: "string",
                            enum: ["json", "markdown"],
                            description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
                        }
                    },
                    required: [],
                },
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            }
        ]
    };
});
// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
        switch (name) {
            case "loxo_get_activity_types": {
                const { response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/activity_types`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_get_todays_tasks": {
                const { user_id, start_date, end_date, per_page, scroll_id, response_format = 'json' } = args;
                let searchParams = new URLSearchParams();
                if (user_id)
                    searchParams.append('user_id', user_id.toString());
                if (start_date)
                    searchParams.append('start_date', start_date);
                if (end_date)
                    searchParams.append('end_date', end_date);
                if (per_page)
                    searchParams.append('per_page', per_page.toString());
                if (scroll_id)
                    searchParams.append('scroll_id', scroll_id);
                const apiResponse = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/schedule_items?${searchParams.toString()}`);
                // Structure response with pagination metadata
                const items = apiResponse?.schedule_items || apiResponse?.items || apiResponse || [];
                const toolResponse = {
                    results: items,
                    pagination: {
                        scroll_id: apiResponse?.scroll_id || null,
                        has_more: !!(apiResponse?.scroll_id),
                        total_count: apiResponse?.total_count || 0,
                        returned_count: Array.isArray(items) ? items.length : 0
                    }
                };
                const formatted = formatResponse(toolResponse, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{
                            type: "text",
                            text
                        }]
                };
            }
            case "loxo_schedule_activity": {
                const { person_id, job_id, company_id, activity_type_id, created_at, notes } = PersonEventSchema.parse(args);
                const formData = new URLSearchParams();
                if (person_id)
                    formData.append('person_event[person_id]', person_id);
                if (job_id)
                    formData.append('person_event[job_id]', job_id);
                if (company_id)
                    formData.append('person_event[company_id]', company_id);
                formData.append('person_event[activity_type_id]', activity_type_id);
                if (created_at)
                    formData.append('person_event[created_at]', created_at);
                if (notes)
                    formData.append('person_event[notes]', notes);
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/person_events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response, null, 2)
                        }]
                };
            }
            case "loxo_search_candidates": {
                const { query, company, title, scroll_id, per_page, person_global_status_id, person_type_id, list_id, include_related_agencies, response_format = 'json' } = args;
                let searchParams = new URLSearchParams();
                if (per_page)
                    searchParams.append('per_page', per_page.toString());
                if (scroll_id)
                    searchParams.append('scroll_id', scroll_id); // scroll_id is already string from schema
                if (person_global_status_id)
                    searchParams.append('person_global_status_id', person_global_status_id.toString());
                if (person_type_id)
                    searchParams.append('person_type_id', person_type_id.toString());
                if (list_id)
                    searchParams.append('list_id', list_id.toString());
                if (include_related_agencies !== undefined)
                    searchParams.append('include_related_agencies', include_related_agencies.toString());
                let constructedQueryParts = [];
                if (query) { // User-provided base query
                    constructedQueryParts.push(`(${query})`);
                }
                if (company) { // Specific field for current company if Loxo supports it, otherwise part of general query
                    // Assuming 'current_company_name_text' or similar. This is speculative.
                    // If not known, this should be part of the general 'query' input by the user.
                    // For now, let's keep it simple and assume it's part of the main query string or Loxo handles it.
                    // A more robust solution would require knowing Loxo's exact Lucene schema.
                    // Let's assume for now that if 'company' is provided, it's added to the general query.
                    constructedQueryParts.push(`current_company_name_text:"${company}"`); // Example, might need adjustment
                }
                if (title) { // Similar for title
                    constructedQueryParts.push(`current_title_text:"${title}"`); // Example
                }
                const finalQueryString = constructedQueryParts.length > 0 ? constructedQueryParts.join(' AND ') : (query ? query : '*:*');
                searchParams.append('query', finalQueryString);
                console.error('Final Search query for API:', finalQueryString);
                try {
                    const apiResponse = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people?${searchParams.toString()}`);
                    const candidateResults = (apiResponse?.people || []).map((person) => ({
                        id: person.id,
                        name: person.name,
                        current_title: person.current_title,
                        current_company: person.current_company,
                        location: person.location,
                        skillsets: person.skillsets,
                        all_raw_tags: person.all_raw_tags,
                    }));
                    const toolResponse = {
                        results: candidateResults,
                        pagination: {
                            scroll_id: apiResponse?.scroll_id || null,
                            has_more: !!(apiResponse?.scroll_id),
                            total_count: apiResponse?.total_count || 0,
                            returned_count: candidateResults.length
                        }
                    };
                    // Format and truncate response
                    const formatted = formatResponse(toolResponse, response_format);
                    const { text } = truncateResponse(formatted);
                    return {
                        content: [{
                                type: "text",
                                text
                            }]
                    };
                }
                catch (err) {
                    const error = err;
                    console.error('Search error:', error);
                    return {
                        content: [{
                                type: "text",
                                text: `Error searching candidates: ${error.message}`
                            }],
                        isError: true
                    };
                }
            }
            case "loxo_get_candidate": {
                const { id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${id}`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_search_jobs": {
                const { query, per_page, page = 1, response_format = 'json' } = args;
                // Build search params
                let searchParams = new URLSearchParams();
                if (query)
                    searchParams.append('query', query);
                if (per_page)
                    searchParams.append('per_page', per_page.toString());
                searchParams.append('page', page.toString());
                const apiResponse = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/jobs?${searchParams.toString()}`);
                // Structure response with pagination metadata
                const jobs = apiResponse?.jobs || apiResponse || [];
                const totalCount = apiResponse?.total_count || 0;
                const returnedCount = Array.isArray(jobs) ? jobs.length : 0;
                const perPageValue = per_page || 20;
                const currentPage = page;
                const totalPages = totalCount > 0 ? Math.ceil(totalCount / perPageValue) : 1;
                const toolResponse = {
                    results: jobs,
                    pagination: {
                        page: currentPage,
                        per_page: perPageValue,
                        total_pages: totalPages,
                        total_count: totalCount,
                        returned_count: returnedCount,
                        has_more: currentPage < totalPages,
                        next_page: currentPage < totalPages ? currentPage + 1 : null
                    }
                };
                const formatted = formatResponse(toolResponse, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{
                            type: "text",
                            text
                        }]
                };
            }
            case "loxo_get_job": {
                const { id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/jobs/${id}`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_log_activity": {
                const { person_id, job_id, company_id, activity_type_id, notes } = PersonEventSchema.parse(args);
                const formData = new URLSearchParams();
                if (person_id)
                    formData.append('person_event[person_id]', person_id);
                if (job_id)
                    formData.append('person_event[job_id]', job_id);
                if (company_id)
                    formData.append('person_event[company_id]', company_id);
                formData.append('person_event[activity_type_id]', activity_type_id);
                if (notes)
                    formData.append('person_event[notes]', notes);
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/person_events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
                };
            }
            case "loxo_search_companies": {
                const { query, scroll_id, company_type_id, list_id, company_global_status_id, response_format = 'json' } = args;
                let searchParams = new URLSearchParams();
                if (query)
                    searchParams.append('query', query);
                if (scroll_id)
                    searchParams.append('scroll_id', scroll_id);
                if (company_type_id)
                    searchParams.append('company_type_id', company_type_id.toString());
                if (list_id)
                    searchParams.append('list_id', list_id.toString());
                if (company_global_status_id)
                    searchParams.append('company_global_status_id', company_global_status_id.toString());
                const apiResponse = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/companies?${searchParams.toString()}`);
                const toolResponse = {
                    results: apiResponse?.companies || [],
                    pagination: {
                        scroll_id: apiResponse?.scroll_id || null,
                        has_more: !!(apiResponse?.scroll_id),
                        total_count: apiResponse?.total_count || 0,
                        returned_count: apiResponse?.companies?.length || 0
                    }
                };
                const formatted = formatResponse(toolResponse, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_get_company_details": {
                const { company_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/companies/${company_id}`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_list_users": {
                const { response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/users`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_get_person_emails": {
                const { id: person_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/emails`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_get_person_phones": {
                const { id: person_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/phones`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_list_person_job_profiles": {
                const { id: person_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/job_profiles`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_get_person_job_profile_detail": {
                const { person_id, resource_id: job_profile_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/job_profiles/${job_profile_id}`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_list_person_education_profiles": {
                const { id: person_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/education_profiles`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            case "loxo_get_person_education_profile_detail": {
                const { person_id, resource_id: education_profile_id, response_format = 'json' } = args;
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/education_profiles/${education_profile_id}`);
                const formatted = formatResponse(response, response_format);
                const { text } = truncateResponse(formatted);
                return {
                    content: [{ type: "text", text }]
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        const error = err;
        console.error(`Error executing tool ${name}:`, error);
        // Handle Zod validation errors with actionable messages
        if (error.name === 'ZodError' || error.message.includes('Zod')) {
            return {
                content: [{
                        type: "text",
                        text: `Parameter validation failed: ${error.message}\n\nNext steps:\n1. Check all required parameters are provided\n2. Verify parameter types match the schema\n3. Review tool documentation for parameter requirements`
                    }],
                isError: true
            };
        }
        // Pass through our formatted error messages or provide generic fallback
        return {
            content: [{
                    type: "text",
                    text: error?.message || 'Unknown error occurred\n\nNext steps:\n1. Retry the request\n2. Check your parameters\n3. Review logs for details'
                }],
            isError: true
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Loxo MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
