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
            throw new Error(`API request failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
        }
        // Only try to parse as JSON if we have content
        return responseText ? JSON.parse(responseText) : null;
    }
    catch (error) {
        console.error('API request error:', error);
        console.error('Request details:', {
            url,
            headers: {
                ...headers,
                authorization: '[REDACTED]' // Don't log the full token
            },
            method: options.method || 'GET'
        });
        throw error;
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
    per_page: z.number().optional().default(20)
});
// Schema specifically for search-candidates tool arguments
const SearchCandidatesSchema = z.object({
    query: z.string().optional().describe("General Lucene search query. Use for specific field searches like past companies, skills, etc."),
    company: z.string().optional().describe("Current company name to search for."),
    title: z.string().optional().describe("Current job title to search for."),
    scroll_id: z.string().optional().describe("Pagination scroll ID from previous search results."), // API expects string
    per_page: z.number().int().optional().default(20).describe("Number of results per page (default 20, max typically 100 by Loxo)."),
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
                description: "Get a list of activity types from Loxo",
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
                description: "Get all tasks and scheduled activities for today or a date range",
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
                description: "Schedule a future activity (like a call or meeting) by creating a person event",
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
                description: "Search for candidates in Loxo. Use the 'query' field for complex Lucene queries, including searching past employment (e.g., 'job_profiles.company_name:\"Old Company\"'). The 'company' parameter targets current employment.",
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
                            description: "Number of results per page (default 20, max typically 100 by Loxo)."
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
                description: "Get detailed information from a candidate's main profile. This may include summaries or full lists of job/education profiles. For guaranteed complete lists and then full details of each item, use list-person-job-profiles, get-person-job-profile-detail, etc., and similarly for education, emails, and phones.",
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
                description: "Get all email addresses for a specific person.",
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
                description: "Get all phone numbers for a specific person.",
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
                description: "Lists job profiles (work history summaries/IDs) for a person. Use get-person-job-profile-detail for full details of each.",
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
                description: "Get full details for a specific job profile (work history item) of a person.",
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
                description: "Lists education profiles (summaries/IDs) for a person. Use get-person-education-profile-detail for full details of each.",
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
                description: "Get full details for a specific education profile item of a person.",
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
                description: "Search for jobs in Loxo using page-based pagination",
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
                description: "Get detailed information about a specific job",
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
                description: "Log a completed activity by creating a person event (logged with current timestamp)",
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
                description: "Search for companies in Loxo.",
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
                description: "Get detailed information about a specific company.",
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
                description: "Get a list of users in the Loxo agency.",
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
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/schedule_items?${searchParams.toString()}`);
                const formatted = formatResponse(response, response_format);
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
                    }));
                    const toolResponse = {
                        results: candidateResults,
                        scroll_id: apiResponse?.scroll_id || null,
                        total_count: apiResponse?.total_count || 0,
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
                const { query, per_page, page, response_format = 'json' } = args;
                // Build search params
                let searchParams = new URLSearchParams();
                if (query)
                    searchParams.append('query', query);
                if (per_page)
                    searchParams.append('per_page', per_page.toString());
                if (page)
                    searchParams.append('page', page.toString());
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/jobs?${searchParams.toString()}`);
                const formatted = formatResponse(response, response_format);
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
                const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/companies?${searchParams.toString()}`);
                const formatted = formatResponse(response, response_format);
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
        return {
            content: [{
                    type: "text",
                    text: `Error: ${error?.message || 'Unknown error occurred'}`
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
