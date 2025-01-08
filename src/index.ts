import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

// Helper function for API calls
async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${LOXO_API_BASE}${endpoint}`;
  const headers = {
    'accept': 'application/json',
    'authorization': `Bearer ${env.LOXO_API_KEY}`,
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    console.error('Request details:', {
      url,
      headers,
      method: options.method || 'GET'
    });
    throw error;
  }
}

// Add before the server creation
// Add after imports
const CallQueueSchema = z.object({
  entity_type: z.enum(["candidate", "contact"]),
  entity_id: z.string(),
  priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
  notes: z.string().optional()
});

const ScheduleActivitySchema = z.object({
  entity_type: z.enum(["candidate", "contact", "job"]),
  entity_id: z.string(),
  activity_type_id: z.string(),
  scheduled_for: z.string(),
  notes: z.string().optional()
});

const SearchSchema = z.object({
  query: z.string(),
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10)
});

const EntityIdSchema = z.object({
  id: z.string()
});

const EntityNoteSchema = z.object({
  entity_type: z.enum(["candidate", "job"]),
  entity_id: z.string(),
  content: z.string()
});

const LogActivitySchema = z.object({
  entity_type: z.enum(["candidate", "job"]),
  entity_id: z.string(),
  activity_type_id: z.string(),
  notes: z.string().optional()
});

type CallQueueArgs = z.infer<typeof CallQueueSchema>;
type ScheduleActivityArgs = z.infer<typeof ScheduleActivitySchema>;
type SearchArgs = z.infer<typeof SearchSchema>;
type EntityIdArg = z.infer<typeof EntityIdSchema>;
type EntityNoteArgs = z.infer<typeof EntityNoteSchema>;
type LogActivityArgs = z.infer<typeof LogActivitySchema>;

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
        name: "get-activity-types",
        description: "Get a list of activity types from Loxo",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "spark-search-activity-types",
        description: "Get a list of activity types from Spark Search",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get-todays-tasks",
        description: "Get all tasks and scheduled activities for today",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        }
      },
      {
        name: "get-call-queue",
        description: "Get the current call queue",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        }
      },
      {
        name: "add-to-call-queue",
        description: "Add a candidate or contact to the call queue",
        inputSchema: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Type of entity (candidate or contact)",
              enum: ["candidate", "contact"]
            },
            entity_id: {
              type: "string",
              description: "ID of the candidate or contact"
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
              default: "medium",
              description: "Priority level for the call"
            },
            notes: {
              type: "string",
              description: "Notes about why this call is needed"
            }
          },
          required: ["entity_type", "entity_id"]
        }
      },
      {
        name: "schedule-activity",
        description: "Schedule a future activity (like a call or meeting)",
        inputSchema: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Type of entity (candidate, contact, job)",
              enum: ["candidate", "contact", "job"]
            },
            entity_id: {
              type: "string",
              description: "ID of the entity"
            },
            activity_type_id: {
              type: "string",
              description: "ID of the activity type"
            },
            scheduled_for: {
              type: "string",
              description: "ISO datetime when the activity should occur"
            },
            notes: {
              type: "string",
              description: "Notes about the scheduled activity"
            }
          },
          required: ["entity_type", "entity_id", "activity_type_id", "scheduled_for"]
        }
      },
      {
        name: "search-candidates",
        description: "Search for candidates in Loxo",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for candidates"
            },
            page: {
              type: "number",
              description: "Page number for pagination"
            },
            per_page: {
              type: "number",
              description: "Number of results per page"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get-candidate",
        description: "Get detailed information about a specific candidate",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Candidate ID"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "search-jobs",
        description: "Search for jobs in Loxo",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for jobs"
            },
            page: {
              type: "number",
              description: "Page number for pagination"
            },
            per_page: {
              type: "number",
              description: "Number of results per page"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get-job",
        description: "Get detailed information about a specific job",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Job ID"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "add-note",
        description: "Add a note to a candidate or job",
        inputSchema: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Type of entity (candidate or job)",
              enum: ["candidate", "job"]
            },
            entity_id: {
              type: "string",
              description: "ID of the entity"
            },
            content: {
              type: "string",
              description: "Content of the note"
            }
          },
          required: ["entity_type", "entity_id", "content"]
        }
      },
      {
        name: "log-activity",
        description: "Log an activity for a candidate or job",
        inputSchema: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Type of entity (candidate or job)",
              enum: ["candidate", "job"]
            },
            entity_id: {
              type: "string",
              description: "ID of the entity"
            },
            activity_type_id: {
              type: "string",
              description: "ID of the activity type"
            },
            notes: {
              type: "string",
              description: "Notes about the activity"
            }
          },
          required: ["entity_type", "entity_id", "activity_type_id"]
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get-activity-types": {
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/activity_types`);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "spark-search-activity-types": {
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/spark-search/activity_types`);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "get-todays-tasks": {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/activities/scheduled?date=${today}`
        );
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(response, null, 2) 
          }]
        };
      }

      case "get-call-queue": {
        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/call-queue`
        );
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(response, null, 2) 
          }]
        };
      }

      case "add-to-call-queue": {
        const { entity_type, entity_id, priority, notes } = CallQueueSchema.parse(args);
        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/call-queue`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entity_type,
              entity_id,
              priority,
              notes
            })
          }
        );
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(response, null, 2) 
          }]
        };
      }

      case "schedule-activity": {
        const { entity_type, entity_id, activity_type_id, scheduled_for, notes } = ScheduleActivitySchema.parse(args);
        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/${entity_type}s/${entity_id}/activities`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_type_id,
              scheduled_for,
              notes
            })
          }
        );
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(response, null, 2) 
          }]
        };
      }

      case "search-candidates": {
        const { query, page, per_page } = SearchSchema.parse(args);
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/candidates/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "get-candidate": {
        const { id } = EntityIdSchema.parse(args);
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/candidates/${id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "search-jobs": {
        const { query, page, per_page } = SearchSchema.parse(args);
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/jobs/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "get-job": {
        const { id } = EntityIdSchema.parse(args);
        const response = await makeRequest(`/${env.LOXO_AGENCY_SLUG}/jobs/${id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "add-note": {
        const { entity_type, entity_id, content } = EntityNoteSchema.parse(args);
        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/${entity_type}s/${entity_id}/notes`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      case "log-activity": {
        const { entity_type, entity_id, activity_type_id, notes } = LogActivitySchema.parse(args);
        const response = await makeRequest(
          `/${env.LOXO_AGENCY_SLUG}/${entity_type}s/${entity_id}/activities`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              activity_type_id,
              notes
            })
          }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('Loxo API error:', error);
    throw error;
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