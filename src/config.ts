import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
loadEnv({
  path: resolve(process.cwd(), '.env'),
  quiet: true
});

const envSchema = z.object({
  LOXO_API_KEY: z.string().min(1, 'LOXO_API_KEY is required'),
  LOXO_DOMAIN: z.string().default('app.loxo.co'),
  LOXO_AGENCY_SLUG: z.string().min(1, 'LOXO_AGENCY_SLUG is required'),
  LOXO_DEFAULT_OWNER_ID: z
    .string()
    .regex(
      /^\d+$/,
      'LOXO_DEFAULT_OWNER_ID must be a numeric user ID — use loxo_list_users to find yours'
    )
    .optional(),
  LOXO_DEFAULT_OWNER_EMAIL: z.string().optional(),
  LOXO_MCP_RESPONSE_LIMIT: z
    .string()
    .regex(/^\d+$/, 'LOXO_MCP_RESPONSE_LIMIT must be a number')
    .transform(Number)
    .default('250000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }

  return result.data;
}
