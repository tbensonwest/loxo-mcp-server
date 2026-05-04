import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { validateEnv } from './config.js';

// Load and validate environment variables
const env = validateEnv();

// Construct API base URL using domain from config
const LOXO_API_BASE = `https://${env.LOXO_DOMAIN}/api`;

// Configurable response size limit (default 250K, override via LOXO_MCP_RESPONSE_LIMIT env var)
const CHARACTER_LIMIT = env.LOXO_MCP_RESPONSE_LIMIT;

// Helper function to truncate responses with clear messaging
function truncateResponse(content: string, limit: number = CHARACTER_LIMIT): { text: string; wasTruncated: boolean } {
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
function formatResponse(data: any, format: 'json' | 'markdown' = 'json'): string {
  if (format === 'markdown') {
    // For now, return JSON wrapped in markdown code block
    // Future enhancement: convert to proper markdown tables/lists
    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }
  return JSON.stringify(data, null, 2);
}

// Validates that a value is a numeric ID before use in URL paths.
// Accepts both string and number inputs. Throws with a user-friendly message
// if invalid, caught by the global handler.
function requireNumericId(value: unknown, fieldName: string): string {
  const str = typeof value === 'number' ? String(value) : value;
  if (typeof str !== 'string' || !/^\d+$/.test(str)) {
    throw new Error(`Invalid ${fieldName}: expected a numeric ID, got "${value}"`);
  }
  return str;
}

// Resolves the owner ID for a write-to-person operation.
// Precedence: explicit arg > LOXO_DEFAULT_OWNER_ID env var (validated) > undefined.
// Defense-in-depth: config.ts already rejects non-numeric values at startup via
// process.exit(1). This runtime guard handles test-time env injection (vi.stubEnv)
// and hypothetical future direct process.env mutations.
function resolveOwnerId(explicitArg: string | undefined): string | undefined {
  if (explicitArg) return explicitArg;
  const envValue = process.env.LOXO_DEFAULT_OWNER_ID;
  return envValue && /^\d+$/.test(envValue) ? envValue : undefined;
}

function resolveOwnerEmail(explicitArg: string | undefined): string | undefined {
  if (explicitArg) return explicitArg;
  return process.env.LOXO_DEFAULT_OWNER_EMAIL || undefined;
}

// Add these type definitions near the top with other types
interface Person {
    id: string;
    name: string;
    current_title?: string;
    current_company?: string;
    location?: string;
    skillsets?: string;
    all_raw_tags?: string;
}

interface SearchPeopleResponse {
    scroll_id: string | null;
    total_count: number;
    people: Person[];
}

// Interface for Company (simplified based on common fields)
interface Company {
    id: number;
    name: string;
    url?: string;
    description?: string;
    company_type_id?: number;
    company_global_status_id?: number;
    // Add other relevant fields as needed
}

interface SearchCompaniesResponse {
    scroll_id: string | null;
    total_count: number;
    companies: Company[];
}

interface SearchCompaniesToolResponse {
    results: Company[];
    pagination: {
        scroll_id: string | null;
        has_more: boolean;
        total_count: number;
        returned_count: number;
    };
}

// Interface for User (simplified)
interface User {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    // Add other relevant fields as needed
}

interface ListUsersResponse {
    users: User[];
    // Potentially other pagination fields if applicable
}

// Detailed interfaces for Person/Candidate
interface EmailInfo {
    value?: string;
    email_type_id?: number;
    // position?: number; // OpenAPI spec shows this for create/update, might not be in GET
}

interface PhoneInfo {
    value?: string;
    phone_type_id?: number;
    // position?: number; // OpenAPI spec shows this for create/update, might not be in GET
}

interface ResumeInfo {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface StatusInfo { // For person_global_status
    id: number;
    name: string;
    // other fields if known
}

interface PersonTypeInfo {
    id: number;
    key: string;
    name: string;
    default?: boolean;
    position?: number;
}

interface SourceTypeInfo {
    id: number;
    name: string;
}

interface EducationProfile {
    id?: number;
    degree?: string;
    school?: string;
    month?: number;
    year?: number;
    education_type_id?: number;
    description?: string;
}

interface JobProfile {
    id: number;
    title?: string;
    company?: {
        id: number;
        name?: string;
    };
    month?: number;
    year?: number;
    end_month?: number | null;
    end_year?: number | null;
    description?: string;
}
  
  interface Candidate { // This will serve as our DetailedPerson interface
    id: string;
    name?: string;
    description?: string;
    location?: string;
    address?: string; // Full address string
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    person_global_status?: StatusInfo | null; // Changed from person_global_status_id
    source_type?: SourceTypeInfo | null; // Changed from source_type_id
    blocked?: boolean;
    blocked_until?: string; // datetime
    title?: string; // Current title - Loxo API might call this 'current_title'
    company?: string; // Current company name (raw text) - Loxo API might call this 'current_company'
    
    profile_picture_thumb_url?: string;
    profile_picture_original_url?: string;

    emails?: EmailInfo[];
    phones?: PhoneInfo[];
    // data_sources?: any[]; // Define if needed
    linkedin_url?: string;
    website?: string;
    
    resumes?: ResumeInfo[];
    // document_urls?: string[]; // If API provides direct links

    all_raw_tags?: string; // API output shows this as a string, not string[]
    skillsets?: string; // Added from cURL output
    person_types?: PersonTypeInfo[]; // Changed from person_type_id
    
    job_profiles?: JobProfile[]; // Existing
    education_profiles?: EducationProfile[];

    agency_id?: number; // Added
    created_at?: string; // Added
    updated_at?: string; // Added
    created_by_id?: number; // Added
    updated_by_id?: number; // Added

    compensation?: number;
    compensation_notes?: string;
    salary?: number;
    salary_type_id?: number;
    compensation_currency_id?: number;
    bonus?: number;
    bonus_type_id?: number;
    bonus_payment_type_id?: number;
    equity?: number;
    equity_type_id?: number;
    owned_by_id?: number;
    // Dynamic fields are complex, skip for now unless specifically requested
    // $dynamic_field_key?: string;
    // $hierarchy_dynamic_field_key?: string[];
  }

// Specific response structure for the search-candidates tool
interface CandidateSearchResult {
    id: string;
    name: string;
    current_title?: string;
    current_company?: string;
    location?: string;
    skillsets?: string;  // Skills for filtering without full profile fetch
    all_raw_tags?: string;  // Tags for filtering without full profile fetch
    // Add primary_email and primary_phone if the search endpoint can provide them easily
}

interface SearchCandidatesToolResponse {
    results: CandidateSearchResult[];
    pagination: {
        scroll_id: string | null;
        has_more: boolean;
        total_count: number;
        returned_count: number;
    };
}
  
  interface SearchResponse {
    results: Candidate[];
    // Add other response fields like total_count, etc.
  }

// Helper function to create actionable error messages
function formatApiError(status: number, statusText: string, responseBody: string, endpoint: string): string {
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
async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
                body: '[redacted]'
            });

            // Throw actionable error message
            const errorMessage = formatApiError(response.status, response.statusText, responseText, endpoint);
            throw new Error(errorMessage);
        }

        // Only try to parse as JSON if we have content
        return responseText ? JSON.parse(responseText) : (null as unknown as T);
    } catch (error) {
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

const GetCandidateActivitiesSchema = z.object({
  person_id: z.coerce.string().regex(/^\d+$/, "person_id must be numeric"),
  per_page: z.coerce.number().int().positive().optional(),
  scroll_id: z.string().optional(),
  response_format: z.enum(['json', 'markdown']).optional(),
  activity_type_ids: z
    .array(z.coerce.string().regex(/^\d+$/, "activity_type_ids[] must all be numeric"))
    .nonempty("activity_type_ids cannot be an empty array")
    .optional()
    .describe("Filter to only these activity types. Use loxo_get_activity_types to discover IDs."),
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

// Schema for create-company tool
const CreateCompanySchema = z.object({
  name: z.string().trim().min(1, "name is required").describe("Company name (required)."),
});

// Schema for list-users tool
const ListUsersSchema = z.object({}); // No specific input parameters

const EntityIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be numeric")
});

const PersonSubResourceIdSchema = z.object({
  person_id: z.string(),
  resource_id: z.string() // Represents job_profile_id or education_profile_id
});

const CreateCandidateSchema = z.object({
  name: z.string().describe("Full name of the candidate (required)."),
  email: z.string().optional().describe("Primary email address."),
  phone: z.string().optional().describe("Primary phone number."),
  current_title: z.string().optional().describe("Current job title."),
  current_company: z.string().optional().describe("Current employer name."),
  location: z.string().optional().describe("City, region, or country."),
  owned_by_id: z.coerce.string().regex(/^\d+$/, "owned_by_id must be numeric").optional().describe("Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var."),
});

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
  owned_by_id: z.coerce.string().regex(/^\d+$/, "owned_by_id must be numeric").optional().describe("Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var."),
  replace_tags: z.boolean().optional().default(false).describe(
    "When true, REPLACES existing tags with the provided array (uses person[all_raw_tags][]). When false (default), adds the provided tags additively (uses person[raw_tags][]) and leaves existing tags untouched."
  ),
  salary: z.number().optional().describe("Current salary, numeric (no currency symbol). Pair with compensation_currency_id."),
  compensation: z.number().optional().describe("Total compensation including base + bonus + equity, numeric."),
  compensation_currency_id: z.number().optional().describe("Currency ID. Use loxo_list_currencies to discover IDs."),
  salary_type_id: z.number().optional().describe("Salary type ID (e.g. annual, hourly). Use loxo_list_salary_types to discover IDs."),
  bonus: z.number().optional().describe("Bonus amount, numeric."),
  description: z.string().optional().describe("The bio / recruiter notes blob. Free text. Replaces existing description."),
  extra_fields: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
  ).optional().describe(
    "Map of {loxo_key: value} for any top-level person field not already covered by an explicit parameter (built-in or tenant-specific dynamic fields, all addressable via person[<key>]). Keys are validated against the dynamic_fields schema cached at server startup; with a cache miss they fall back to /^[a-zA-Z][a-zA-Z0-9_]*$/. Values may be string, number, or an array of strings/numbers (used for Hierarchy fields like skillset_ids that Loxo writes as person[<key>][] form entries, per Phase 0.3 verification)."
  ),
});

const AddToPipelineSchema = z.object({
  job_id: z.string().regex(/^\d+$/, "job_id must be numeric").describe("The job ID to add the candidate to."),
  person_id: z.string().regex(/^\d+$/, "person_id must be numeric").describe("The candidate's person ID."),
  notes: z.string().optional().describe("Optional notes (e.g. 'Sourced from LinkedIn applications')."),
});

const UploadResumeSchema = z.object({
  person_id: z.string().regex(/^\d+$/, "person_id must be numeric").describe("The candidate's person ID."),
  file_name: z.string().describe("File name including extension (e.g. 'john-smith-cv.pdf')."),
  file_content_base64: z.string().describe("Base64-encoded file content."),
});

const ListDealWorkflowsSchema = z.object({
  response_format: z.enum(['json', 'markdown']).optional(),
});

const GetDealWorkflowSchema = z.object({
  id: z.coerce.string().regex(/^\d+$/, "id must be numeric").describe("Deal workflow ID"),
  response_format: z.enum(['json', 'markdown']).optional(),
});

const SearchDealsSchema = z.object({
  query: z.string().optional().describe("Lucene query string"),
  owner_emails: z.array(z.string().email()).optional().describe("Filter by owner email addresses"),
  scroll_id: z.string().optional().describe("Pagination cursor from previous search"),
  response_format: z.enum(['json', 'markdown']).optional(),
});

const GetDealSchema = z.object({
  id: z.coerce.string().regex(/^\d+$/, "id must be numeric").describe("Deal ID"),
  response_format: z.enum(['json', 'markdown']).optional(),
});

const CreateDealSchema = z.object({
  name: z.string().trim().min(1, "name is required").describe("Deal name (required)"),
  amount: z.number().describe("Deal value/amount (required)"),
  closes_at: z.string().describe("Expected close date, ISO datetime (required)"),
  workflow_id: z.coerce.string().regex(/^\d+$/, "workflow_id must be numeric").describe("Deal workflow/pipeline ID (required). Use loxo_list_deal_workflows to find."),
  pipeline_stage_id: z.coerce.string().regex(/^\d+$/, "pipeline_stage_id must be numeric").describe("Initial pipeline stage ID (required). Use loxo_get_deal_workflow to find stage IDs."),
  owner_email: z.string().email().optional().describe("Owner email. Falls back to LOXO_DEFAULT_OWNER_EMAIL env var."),
  company_id: z.coerce.string().regex(/^\d+$/, "company_id must be numeric").optional().describe("Associated company ID"),
  person_id: z.coerce.string().regex(/^\d+$/, "person_id must be numeric").optional().describe("Associated person/contact ID"),
  job_id: z.coerce.string().regex(/^\d+$/, "job_id must be numeric").optional().describe("Associated job ID"),
});

const LogDealActivitySchema = z.object({
  deal_id: z.coerce.string().regex(/^\d+$/, "deal_id must be numeric").describe("Deal ID"),
  activity_type_id: z.coerce.string().regex(/^\d+$/, "activity_type_id must be numeric").describe("Activity type ID. Use loxo_get_activity_types with the deal's workflow_id to find valid IDs."),
  notes: z.string().optional().describe("Optional notes for this activity"),
});

type PersonEventArgs = z.infer<typeof PersonEventSchema>;
type SearchArgs = z.infer<typeof SearchSchema>; // Generic search, might deprecate if specific ones cover all uses
type TypeSearchCandidatesArgs = z.infer<typeof SearchCandidatesSchema>;
type TypeSearchCompaniesArgs = z.infer<typeof SearchCompaniesSchema>;
type TypeGetCompanyDetailsArgs = z.infer<typeof GetCompanyDetailsSchema>;
// No specific type needed for ListUsersArgs as it's an empty object

type EntityIdArg = z.infer<typeof EntityIdSchema>;

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

// Create server instance
const server = new Server(
  {
    name: "loxo-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "loxo_get_activity_types",
        description: "Get a list of all available activity types in Loxo (e.g., calls, meetings, interviews). Use this before scheduling or logging activities to find the correct activity_type_id. Pass a deal workflow_id to get deal-specific activity types (e.g. 'Deal Won', 'New Lead') instead of candidate activity types. Example: Call loxo_list_deal_workflows to get the workflow ID, then pass it here.",
        inputSchema: {
          type: "object",
          properties: {
            response_format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Response format: 'json' for structured data (default), 'markdown' for human-readable formatted text"
            },
            workflow_id: {
              type: "string",
              description: "Optional: Filter by workflow ID. Pass a deal workflow ID to get deal-specific activity types instead of candidate activity types. Use loxo_list_deal_workflows to find workflow IDs."
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
        description: "Search for candidates using Lucene query syntax. Uses cursor-based pagination with scroll_id. Returns skillsets and tags in results for filtering without additional API calls.\n\nIMPORTANT - LOXO FIELD NAME MAPPING:\n- Query uses 'skills' (search index field): query='skills:\"Python\"'\n- Response returns 'skillsets' (API field): {skillsets: \"Python, JavaScript\"}\n- Query uses 'all_raw_tags', response returns 'all_raw_tags' (same)\n\nSIMPLE QUERY EXAMPLES:\n(1) Past employer: query='job_profiles.company_name:\"Google\"'\n(2) Skills: query='skills:\"Python\"'\n(3) Current role: company='Acme Corp' and title='Engineer'\n\nCOMPLEX MULTI-CRITERIA EXAMPLES:\n(4) Multiple titles with skills: query='(current_title:\"Director\" OR current_title:\"Senior Director\") AND skills:\"financial due diligence\"'\n(5) Multiple role types at specific level: query='(current_title:(\"Deal Advisory\" OR \"Transaction Services\" OR \"Transaction Advisory\")) AND current_title:\"Director\" AND skills:\"due diligence\"'\n(6) Past companies with skills: query='(job_profiles.company_name:(\"KPMG\" OR \"Deloitte\" OR \"PwC\" OR \"EY\")) AND skills:(\"M&A\" OR \"financial due diligence\")'\n(7) Combined current AND past: query='current_title:\"Director\" AND job_profiles.company_name:(\"Big 4\") AND skills:\"financial modeling\"'\n(8) Tags: query='all_raw_tags:\"key account\"'\n\nNULL/EMPTY FIELD SEARCHES (data quality checks):\n(9) Candidates WITHOUT skills: query='NOT _exists_:skills'\n(10) Candidates WITH skills: query='_exists_:skills'\n(11) Candidates WITHOUT tags: query='NOT _exists_:all_raw_tags'\n(12) Candidates missing location: query='NOT _exists_:location'\n(13) Candidates missing current company: query='NOT _exists_:current_company'\n\nTIPS: Use OR for multiple options, AND to combine criteria, parentheses for grouping, NOT _exists_:fieldname for null checks. ALWAYS use search index field names (skills not skillsets) in queries. Start with comprehensive queries to get all relevant candidates in fewer API calls.\n\nWhen evaluating candidate fit for a role or preparing recommendations, follow up with loxo_get_candidate_brief for shortlisted candidates to get recruiter intake notes and recent activity context.\n\nReturns: id, name, current_title, current_company, location, skillsets (from 'skills' field), all_raw_tags. Use scroll_id from pagination for next page.",
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
        description: "Get complete candidate profile including bio, location, current role, skills, tags, compensation, and embedded lists of jobs/education/emails/phones. The 'description' field contains the recruiter's call and intake notes — personal circumstances, motivations, compensation expectations, and role preferences. This is often the richest source of candidate intelligence. For a complete picture combining intake notes with recent activity (including Ringover call summaries), use loxo_get_candidate_brief instead. Example: After searching candidates, use their ID here to get full details.",
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
            id: { type: "string", description: "The ID of the person."},
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
        description: "Log a completed activity (call, email, interview) that already happened. Uses current timestamp automatically. Use loxo_get_activity_types first to get correct activity_type_id. Example: Just finished phone screen with candidate - log it with activity_type_id for 'phone screen', person_id, and notes about the conversation. Optionally link to job_id or company_id. Note: activity_type_id=1550055 ('Added to Job') adds candidates to a job pipeline — for that, prefer loxo_add_to_pipeline which handles the correct type automatically.",
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
        name: "loxo_create_company",
        description: "Create a new company (client/target account) record in Loxo. Currently only the name is accepted; additional fields (url, description, status) should be edited in the Loxo UI for now. Use after discovering a new client or target account during a conversation. Example: 'Add Acme Corp as a new client' → call this with name='Acme Corp'.",
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Company name (required)." },
          },
          required: ["name"],
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
      },
      {
        name: "loxo_create_candidate",
        description: "Create a new candidate record in Loxo with name, contact info, and current role. Source type is auto-set to 'API'. Owner is set from the optional owned_by_id arg, or falls back to the LOXO_DEFAULT_OWNER_ID env var if configured. After creating, use loxo_update_candidate to set tags, skillsets, person_type, source_type, and sector — these fields require a separate PUT call. Example workflow: (1) loxo_create_candidate with name/email/phone/title/company, (2) loxo_update_candidate to add tags and skillset, (3) loxo_add_to_pipeline to add to a job.",
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
            owned_by_id: { type: "string", description: "Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var if set." },
          },
          required: ["name"],
        },
      },
      {
        name: "loxo_update_candidate",
        description: "Update an existing candidate's record in Loxo. Use to set tags, skillsets, sector, person type, source type, basic profile fields, compensation (salary, bonus, currency, salary_type), the description blob, and any other top-level person field via extra_fields. Tags are additive by default (does not remove existing); pass replace_tags=true for the destructive replace behaviour. Tags and skillsets require specific field formats: this tool handles the conversion automatically. Use loxo_list_skillsets and loxo_list_person_types to discover IDs. Use the dynamic_fields discovery probe to enumerate the valid extra_fields keys for the tenant.",
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
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
            tags: { type: "array", items: { type: "string" }, description: "Tags to add (additive by default, does not remove existing). Use replace_tags=true to set the full list explicitly. E.g. ['cv-import', 'debt-advisory']." },
            replace_tags: { type: "boolean", description: "Default false (additive). Set to true to REPLACE existing tags with the provided array. Use with care: replace mode wipes any tags not in the input." },
            skillset_ids: { type: "array", items: { type: "number" }, description: "Skillset IDs from loxo_list_skillsets. E.g. [5704030] = Debt Advisory." },
            sector_ids: { type: "array", items: { type: "number" }, description: "Sector IDs from loxo_list_skillsets. E.g. [5690364] = Financial Services." },
            person_type_id: { type: "number", description: "Person type ID. 80073=Active Candidate, 78122=Prospect Candidate." },
            source_type_id: { type: "number", description: "Source type ID. 1206583=LinkedIn, 1206592=API." },
            owned_by_id: { type: "string", description: "Loxo user ID to set as record owner. Overrides LOXO_DEFAULT_OWNER_ID env var." },
            salary: { type: "number", description: "Current salary, numeric (no currency symbol). Pair with compensation_currency_id." },
            compensation: { type: "number", description: "Total compensation including base + bonus + equity, numeric." },
            compensation_currency_id: { type: "number", description: "Currency ID. Use loxo_list_currencies to discover IDs." },
            salary_type_id: { type: "number", description: "Salary type ID (e.g. annual, hourly). Use loxo_list_salary_types to discover IDs." },
            bonus: { type: "number", description: "Bonus amount, numeric." },
            description: { type: "string", description: "The bio / recruiter notes blob. Free text. Replaces existing description." },
            extra_fields: {
              type: "object",
              description: "Map of Loxo person field keys (top-level on the person object) to values. Use to set fields not covered by explicit parameters. E.g. { \"expected_salary\": 95000, \"rejection_reason\": \"comp expectations\", \"skillset_ids\": [12, 34] }. Arrays are written as person[<key>][] form entries (used for Hierarchy fields like skillsets and sectors).",
              additionalProperties: {
                oneOf: [
                  { type: "string" },
                  { type: "number" },
                  { type: "array", items: { type: ["string", "number"] } }
                ]
              }
            },
          },
          required: ["id"],
        },
      },
      {
        name: "loxo_get_candidate_activities",
        description: "Get the full unfiltered activity history for a candidate — all calls, emails, meetings, notes, pipeline moves, and automation events. Returns most recent activities first. Optionally filter by activity_type_ids (use loxo_get_activity_types to discover IDs). For a filtered view with only intel-rich activities (excluding pipeline noise), use loxo_get_candidate_brief instead. For the recruiter's own call/intake notes (motivations, personal circumstances, compensation), check the 'description' field via loxo_get_candidate or loxo_get_candidate_brief. Example: Before emailing a candidate, call this to check if someone already contacted them last week.",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        inputSchema: {
          type: "object",
          properties: {
            person_id: { type: "string", description: "The candidate's person ID (required)." },
            per_page: { type: "number", description: "Results per page (default 20)." },
            scroll_id: { type: "string", description: "Pagination cursor from previous response." },
            response_format: { type: "string", enum: ["json", "markdown"], description: "Response format: 'json' (default) or 'markdown'." },
            activity_type_ids: {
              type: "array",
              items: { type: "string" },
              description: "Optional filter to only specific activity types (e.g., only calls or only emails). Use loxo_get_activity_types first to discover IDs.",
            },
          },
          required: ["person_id"],
        },
      },
      {
        name: "loxo_get_candidate_brief",
        description: "Get a complete candidate brief in one call: full profile (including recruiter intake/call notes in the 'description' field), all contact details, and recent intel-rich activities (calls, emails, notes, interviews — filtered to exclude pipeline moves and automation noise). Use this as the first step whenever you need full candidate context — before drafting outreach, preparing client briefing packs, pipeline status updates, or evaluating candidate-role fit. The combination of intake notes and activity history gives the most complete picture of a candidate. Supports pagination via scroll_id for retrieving older activity when you need to dig deeper (e.g. finding salary expectations from an earlier conversation). Returns: profile fields, email list, phone list, recent_activities (intel-rich only), activity_pagination.",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The candidate's person ID (required)." },
            scroll_id: { type: "string", description: "Pagination cursor for older intel-rich activities." },
            response_format: { type: "string", enum: ["json", "markdown"], description: "Response format: 'json' (default) or 'markdown'." },
          },
          required: ["id"],
        },
      },
      {
        name: "loxo_get_job_pipeline",
        description: "Get all candidates in the pipeline for a specific job, with their current stage. Returns candidate IDs and pipeline stages only. For client briefing packs or status updates, follow up with loxo_get_candidate_brief for each candidate to get their intake notes, personal context, and recent activity (including Ringover call summaries). Example: 'Show me the pipeline for job 456' returns all candidates and their stage (sourced, screened, interviewing, offer, placed).",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        inputSchema: {
          type: "object",
          properties: {
            job_id: { type: "string", description: "The job ID (required)." },
            per_page: { type: "number", description: "Results per page (default 20)." },
            scroll_id: { type: "string", description: "Pagination cursor from previous response." },
            response_format: { type: "string", enum: ["json", "markdown"], description: "Response format: 'json' (default) or 'markdown'." },
          },
          required: ["job_id"],
        },
      },
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
      {
        name: "loxo_list_deal_workflows",
        description: "List all deal workflows (pipelines) with their IDs and names. Use the returned workflow ID with loxo_get_deal_workflow to see pipeline stages, or pass it to loxo_get_activity_types to get deal-specific activity types.",
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
        name: "loxo_get_deal_workflow",
        description: "Get a single deal workflow including its pipeline stages. Use the returned pipeline_stage_id values when creating deals with loxo_create_deal.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Deal workflow ID"
            },
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
        name: "loxo_search_deals",
        description: "Search and list deals with optional Lucene query, owner email filter, and cursor-based pagination. Returns deals with pagination metadata. Use loxo_list_deal_workflows first to understand which pipelines exist.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Lucene query string (optional)"
            },
            owner_emails: {
              type: "array",
              items: { type: "string" },
              description: "Filter by owner email addresses (optional)"
            },
            scroll_id: {
              type: "string",
              description: "Pagination cursor from previous search results"
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
        name: "loxo_get_deal",
        description: "Get full details of a single deal by ID, including name, amount, close date, pipeline stage, and linked company/person/job.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Deal ID"
            },
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
        name: "loxo_create_deal",
        description: "Create a new deal in a pipeline. Requires name, amount, close date, workflow_id, and pipeline_stage_id. Use loxo_list_deal_workflows and loxo_get_deal_workflow to find valid workflow and stage IDs. Owner email falls back to LOXO_DEFAULT_OWNER_EMAIL env var if not provided. Optionally link to a company, person, or job.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Deal name (required)" },
            amount: { type: "number", description: "Deal value/amount (required)" },
            closes_at: { type: "string", description: "Expected close date, ISO datetime (required)" },
            workflow_id: { type: "string", description: "Deal workflow/pipeline ID (required). Use loxo_list_deal_workflows to find." },
            pipeline_stage_id: { type: "string", description: "Initial pipeline stage ID (required). Use loxo_get_deal_workflow to find stage IDs." },
            owner_email: { type: "string", description: "Owner email. Falls back to LOXO_DEFAULT_OWNER_EMAIL env var." },
            company_id: { type: "string", description: "Associated company ID (optional)" },
            person_id: { type: "string", description: "Associated person/contact ID (optional)" },
            job_id: { type: "string", description: "Associated job ID (optional)" },
          },
          required: ["name", "amount", "closes_at", "workflow_id", "pipeline_stage_id"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      {
        name: "loxo_log_deal_activity",
        description: "Log an activity or event on a deal (e.g. 'Deal Won', 'Meeting', 'Note'). Use loxo_get_activity_types with the deal's workflow_id to find valid activity_type_id values — deal activity types are different from candidate activity types.",
        inputSchema: {
          type: "object",
          properties: {
            deal_id: { type: "string", description: "Deal ID" },
            activity_type_id: { type: "string", description: "Activity type ID. Use loxo_get_activity_types with workflow_id to find valid IDs." },
            notes: { type: "string", description: "Optional notes for this activity" },
          },
          required: ["deal_id", "activity_type_id"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "loxo_get_activity_types": {
        const { response_format = 'json', workflow_id } = args as any;
        let endpoint = `/${env.LOXO_AGENCY_SLUG}/activity_types`;
        if (workflow_id) {
          requireNumericId(workflow_id, 'workflow_id');
          endpoint += `?workflow_id=${workflow_id}`;
        }
        const response = await makeRequest(endpoint);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_todays_tasks": {
        const { user_id, start_date, end_date, per_page, scroll_id, response_format = 'json' } = args as any;

        let searchParams = new URLSearchParams();
        if (user_id) searchParams.append('user_id', user_id.toString());
        if (start_date) searchParams.append('start_date', start_date);
        if (end_date) searchParams.append('end_date', end_date);
        if (per_page) searchParams.append('per_page', per_page.toString());
        if (scroll_id) searchParams.append('scroll_id', scroll_id);

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/schedule_items?${searchParams.toString()}`
        );

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

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
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
        if (person_id) formData.append('person_event[person_id]', person_id);
        if (job_id) formData.append('person_event[job_id]', job_id);
        if (company_id) formData.append('person_event[company_id]', company_id);
        formData.append('person_event[activity_type_id]', activity_type_id);
        if (created_at) formData.append('person_event[created_at]', created_at);
        if (notes) formData.append('person_event[notes]', notes);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/person_events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          }
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      }

      case "loxo_search_candidates": {
        const {
            query,
            company,
            title,
            scroll_id,
            per_page,
            person_global_status_id,
            person_type_id,
            list_id,
            include_related_agencies,
            response_format = 'json'
        } = args as any;
        
        let searchParams = new URLSearchParams();
        if (per_page) searchParams.append('per_page', per_page.toString());
        if (scroll_id) searchParams.append('scroll_id', scroll_id); // scroll_id is already string from schema
        if (person_global_status_id) searchParams.append('person_global_status_id', person_global_status_id.toString());
        if (person_type_id) searchParams.append('person_type_id', person_type_id.toString());
        if (list_id) searchParams.append('list_id', list_id.toString());
        if (include_related_agencies !== undefined) searchParams.append('include_related_agencies', include_related_agencies.toString());

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
             constructedQueryParts.push(`current_company_name_text:"${company.replace(/[\\"]/g, '\\$&')}"`);
        }
        if (title) {
             constructedQueryParts.push(`current_title_text:"${title.replace(/[\\"]/g, '\\$&')}"`); // Example
        }
        
        const finalQueryString = constructedQueryParts.length > 0 ? constructedQueryParts.join(' AND ') : (query ? query : '*:*');
        searchParams.append('query', finalQueryString);
        
        console.error('Final Search query for API:', finalQueryString);
        
        try {
            const apiResponse = await makeRequest<SearchPeopleResponse>(
                `/${env.LOXO_AGENCY_SLUG}/people?${searchParams.toString()}`
            );
    
            const candidateResults: CandidateSearchResult[] = (apiResponse?.people || []).map((person: Person) => ({
                id: person.id,
                name: person.name,
                current_title: person.current_title,
                current_company: person.current_company,
                location: person.location,
                skillsets: person.skillsets,
                all_raw_tags: person.all_raw_tags,
            }));
            
            const toolResponse: SearchCandidatesToolResponse = {
                results: candidateResults,
                pagination: {
                    scroll_id: apiResponse?.scroll_id || null,
                    has_more: !!(apiResponse?.scroll_id),
                    total_count: apiResponse?.total_count || 0,
                    returned_count: candidateResults.length
                }
            };

            // Format and truncate response
            const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
            const { text } = truncateResponse(formatted);

            return {
                content: [{
                    type: "text",
                    text
                }]
            };
        } catch (err) {
            const error = err as Error;
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
        const { id, response_format = 'json' } = args as any;
        requireNumericId(id, 'id');
        const response = await makeRequest<Candidate>(`/${env.LOXO_AGENCY_SLUG}/people/${id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_search_jobs": {
        const { query, per_page, page = 1, response_format = 'json' } = args as any;

        // Build search params
        let searchParams = new URLSearchParams();
        if (query) searchParams.append('query', query);
        if (per_page) searchParams.append('per_page', per_page.toString());
        searchParams.append('page', page.toString());

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/jobs?${searchParams.toString()}`
        );

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

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);

        return {
          content: [{
            type: "text",
            text
          }]
        };
      }

      case "loxo_get_job": {
        const { id, response_format = 'json' } = args as any;
        requireNumericId(id, 'id');
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/jobs/${id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_log_activity": {
        const { person_id, job_id, company_id, activity_type_id, notes } = PersonEventSchema.parse(args);

        const formData = new URLSearchParams();
        if (person_id) formData.append('person_event[person_id]', person_id);
        if (job_id) formData.append('person_event[job_id]', job_id);
        if (company_id) formData.append('person_event[company_id]', company_id);
        formData.append('person_event[activity_type_id]', activity_type_id);
        if (notes) formData.append('person_event[notes]', notes);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/person_events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "loxo_search_companies": {
        const {
          query,
          scroll_id,
          company_type_id,
          list_id,
          company_global_status_id,
          response_format = 'json'
        } = args as any;

        let searchParams = new URLSearchParams();
        if (query) searchParams.append('query', query);
        if (scroll_id) searchParams.append('scroll_id', scroll_id);
        if (company_type_id) searchParams.append('company_type_id', company_type_id.toString());
        if (list_id) searchParams.append('list_id', list_id.toString());
        if (company_global_status_id) searchParams.append('company_global_status_id', company_global_status_id.toString());

        const apiResponse = await makeRequest<SearchCompaniesResponse>(
          `/${env.LOXO_AGENCY_SLUG}/companies?${searchParams.toString()}`
        );

        const toolResponse: SearchCompaniesToolResponse = {
          results: apiResponse?.companies || [],
          pagination: {
            scroll_id: apiResponse?.scroll_id || null,
            has_more: !!(apiResponse?.scroll_id),
            total_count: apiResponse?.total_count || 0,
            returned_count: apiResponse?.companies?.length || 0
          }
        };

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_company_details": {
        const { company_id, response_format = 'json' } = args as any;
        requireNumericId(company_id, 'company_id');
        const response = await makeRequest<Company>(
          `/${env.LOXO_AGENCY_SLUG}/companies/${company_id}`
        );
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_list_users": {
        const { response_format = 'json' } = args as any;
        const response = await makeRequest<ListUsersResponse>(
          `/${env.LOXO_AGENCY_SLUG}/users`
        );
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_person_emails": {
        const { id: person_id, response_format = 'json' } = args as any;
        requireNumericId(person_id, 'id');
        const response = await makeRequest<EmailInfo[]>(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/emails`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_person_phones": {
        const { id: person_id, response_format = 'json' } = args as any;
        requireNumericId(person_id, 'id');
        const response = await makeRequest<PhoneInfo[]>(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/phones`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_list_person_job_profiles": {
        const { id: person_id, response_format = 'json' } = args as any;
        requireNumericId(person_id, 'id');
        const response = await makeRequest<JobProfile[]>(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/job_profiles`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_person_job_profile_detail": {
        const { person_id, resource_id: job_profile_id, response_format = 'json' } = args as any;
        requireNumericId(person_id, 'person_id');
        requireNumericId(job_profile_id, 'resource_id');
        const response = await makeRequest<JobProfile>(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/job_profiles/${job_profile_id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_list_person_education_profiles": {
        const { id: person_id, response_format = 'json' } = args as any;
        requireNumericId(person_id, 'id');
        const response = await makeRequest<EducationProfile[]>(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/education_profiles`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_person_education_profile_detail": {
        const { person_id, resource_id: education_profile_id, response_format = 'json' } = args as any;
        requireNumericId(person_id, 'person_id');
        requireNumericId(education_profile_id, 'resource_id');
        const response = await makeRequest<EducationProfile>(`/${env.LOXO_AGENCY_SLUG}/people/${person_id}/education_profiles/${education_profile_id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_create_candidate": {
        const { name, email, phone, current_title, current_company, location, owned_by_id } = CreateCandidateSchema.parse(args);

        const formData = new URLSearchParams();
        formData.append('person[name]', name);
        if (email) formData.append('person[email]', email);
        if (phone) formData.append('person[phone]', phone);
        if (current_title) formData.append('person[title]', current_title);
        if (current_company) formData.append('person[company]', current_company);
        if (location) formData.append('person[location]', location);

        const resolvedOwnerId = resolveOwnerId(owned_by_id);
        if (resolvedOwnerId) {
          formData.append('person[owned_by_id]', resolvedOwnerId);
        }

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

      case "loxo_update_candidate": {
        const { id, name: updateName, email, phone, current_title, current_company, location, tags, replace_tags, skillset_ids, sector_ids, person_type_id, source_type_id, owned_by_id, salary, compensation, compensation_currency_id, salary_type_id, bonus, description, extra_fields } = UpdateCandidateSchema.parse(args);

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
          const fieldName = replace_tags ? 'person[all_raw_tags][]' : 'person[raw_tags][]';
          for (const tag of tags) {
            formData.append(fieldName, tag);
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

        if (salary !== undefined) formData.append('person[salary]', salary.toString());
        if (compensation !== undefined) formData.append('person[compensation]', compensation.toString());
        if (compensation_currency_id !== undefined) formData.append('person[compensation_currency_id]', compensation_currency_id.toString());
        if (salary_type_id !== undefined) formData.append('person[salary_type_id]', salary_type_id.toString());
        if (bonus !== undefined) formData.append('person[bonus]', bonus.toString());
        if (description !== undefined) formData.append('person[description]', description);

        if (extra_fields) {
          const SAFE_KEY = /^[a-zA-Z][a-zA-Z0-9_]*$/;
          // Optional schema-cache check. If the server has loaded /dynamic_fields at
          // startup, prefer membership in the cached Person key set; otherwise fall
          // back to the regex. Built-in keys (salary, compensation, etc.) appear in
          // /dynamic_fields with built_in: true so the cache covers both kinds.
          const personKeyCache: Set<string> | null = (globalThis as any).LOXO_PERSON_KEY_CACHE ?? null;
          for (const [key, value] of Object.entries(extra_fields)) {
            const allowed = personKeyCache ? personKeyCache.has(key) : SAFE_KEY.test(key);
            if (!allowed) {
              return {
                content: [{ type: "text", text: `Invalid extra_fields key: ${key}. Not in cached Person dynamic_fields schema and does not match safe-key pattern.` }],
                isError: true,
              };
            }
            if (Array.isArray(value)) {
              // Hierarchy fields (skillset_ids, sector_ids, custom_hierarchy_*) come
              // back from Loxo as arrays per Phase 0.3 verification, so they must be
              // written via person[<key>][] form entries (one append per element).
              // value.toString() on an array would join with commas, which Loxo treats
              // as a single string and silently drops.
              for (const v of value) formData.append(`person[${key}][]`, v.toString());
            } else {
              formData.append(`person[${key}]`, value.toString());
            }
          }
        }

        const resolvedOwnerId = resolveOwnerId(owned_by_id);
        if (resolvedOwnerId) {
          formData.append('person[owned_by_id]', resolvedOwnerId);
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

      case "loxo_create_company": {
        const { name } = CreateCompanySchema.parse(args);

        const formData = new URLSearchParams();
        formData.append('company[name]', name);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/companies`,
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

      case "loxo_get_candidate_activities": {
        const { person_id, per_page, scroll_id, response_format = 'json', activity_type_ids } = GetCandidateActivitiesSchema.parse(args);

        const params = new URLSearchParams();
        params.append('person_id', person_id);
        if (per_page) params.append('per_page', per_page.toString());
        if (scroll_id) params.append('scroll_id', scroll_id);
        if (activity_type_ids) {
          for (const id of activity_type_ids) {
            params.append('activity_type_ids[]', id);
          }
        }

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/person_events?${params.toString()}`
        );

        const items = apiResponse?.person_events || apiResponse?.events || apiResponse || [];
        const toolResponse = {
          results: items,
          pagination: {
            scroll_id: apiResponse?.scroll_id || null,
            has_more: !!(apiResponse?.scroll_id),
            total_count: apiResponse?.total_count || 0,
            returned_count: Array.isArray(items) ? items.length : 0,
          },
        };

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return { content: [{ type: "text", text }] };
      }

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
          ? allActivities.filter((a: { activity_type_id: number }) => !NOISE_ACTIVITY_TYPE_IDS.has(a.activity_type_id))
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

      case "loxo_get_job_pipeline": {
        const { job_id, per_page, scroll_id, response_format = 'json' } = args as any;
        requireNumericId(job_id, 'job_id');

        const params = new URLSearchParams();
        if (per_page) params.append('per_page', per_page.toString());
        if (scroll_id) params.append('scroll_id', scroll_id);
        const query = params.toString();

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/jobs/${job_id}/candidates${query ? `?${query}` : ''}`
        );

        const contacts = apiResponse?.candidates || [];
        const toolResponse = {
          job_id,
          results: contacts,
          pagination: {
            scroll_id: apiResponse?.scroll_id || null,
            has_more: !!(apiResponse?.scroll_id),
            total_count: apiResponse?.total_count || 0,
            returned_count: Array.isArray(contacts) ? contacts.length : 0,
          },
        };

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return { content: [{ type: "text", text }] };
      }

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

      case "loxo_upload_resume": {
        const { person_id, file_name, file_content_base64 } = UploadResumeSchema.parse(args);

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

      case "loxo_list_deal_workflows": {
        const { response_format = 'json' } = ListDealWorkflowsSchema.parse(args);
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/deal_workflows`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_get_deal_workflow": {
        const { id, response_format = 'json' } = GetDealWorkflowSchema.parse(args);
        requireNumericId(id, 'id');
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/deal_workflows/${id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_search_deals": {
        const { query, owner_emails, scroll_id, response_format = 'json' } = SearchDealsSchema.parse(args);

        const searchParams = new URLSearchParams();
        if (query) searchParams.append('query', query);
        if (scroll_id) searchParams.append('scroll_id', scroll_id);
        if (owner_emails) {
          for (const email of owner_emails) {
            searchParams.append('owner_emails[]', email);
          }
        }

        const apiResponse: any = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/deals?${searchParams.toString()}`
        );

        const deals = apiResponse?.deals || apiResponse || [];
        const toolResponse = {
          results: Array.isArray(deals) ? deals : [],
          pagination: {
            scroll_id: apiResponse?.scroll_id || null,
            has_more: !!(apiResponse?.scroll_id),
            total_count: apiResponse?.total_count || 0,
            returned_count: Array.isArray(deals) ? deals.length : 0,
          },
        };

        const formatted = formatResponse(toolResponse, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return { content: [{ type: "text", text }] };
      }

      case "loxo_get_deal": {
        const { id, response_format = 'json' } = GetDealSchema.parse(args);
        requireNumericId(id, 'id');
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/deals/${id}`);
        const formatted = formatResponse(response, response_format as 'json' | 'markdown');
        const { text } = truncateResponse(formatted);
        return {
          content: [{ type: "text", text }]
        };
      }

      case "loxo_create_deal": {
        const { name, amount, closes_at, workflow_id, pipeline_stage_id, owner_email, company_id, person_id, job_id } = CreateDealSchema.parse(args);

        const resolvedEmail = resolveOwnerEmail(owner_email);
        if (!resolvedEmail) {
          return {
            content: [{ type: "text", text: "owner_email is required but was not provided and LOXO_DEFAULT_OWNER_EMAIL is not set. Use loxo_list_users to find valid email addresses." }],
            isError: true,
          };
        }

        const formData = new URLSearchParams();
        formData.append('deal[name]', name);
        formData.append('deal[amount]', amount.toString());
        formData.append('deal[closes_at]', closes_at);
        formData.append('deal[workflow_id]', workflow_id);
        formData.append('deal[pipeline_stage_id]', pipeline_stage_id);
        formData.append('deal[owner_email]', resolvedEmail);
        if (company_id) formData.append('deal[company_id]', company_id);
        if (person_id) formData.append('deal[person_id]', person_id);
        if (job_id) formData.append('deal[job_id]', job_id);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/deals`,
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

      case "loxo_log_deal_activity": {
        const { deal_id, activity_type_id, notes } = LogDealActivitySchema.parse(args);
        requireNumericId(deal_id, 'deal_id');

        const formData = new URLSearchParams();
        formData.append('activity_type_id', activity_type_id);
        if (notes) formData.append('notes', notes);

        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/deals/${deal_id}/events`,
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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const error = err as Error;
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

export { server, truncateResponse, formatResponse };
