import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
// Load environment variables from .env file
loadEnv({
    path: resolve(process.cwd(), '.env')
});
const envSchema = z.object({
    LOXO_API_KEY: z.string().min(1, 'LOXO_API_KEY is required'),
    LOXO_DOMAIN: z.string().default('app.loxo.co'),
    LOXO_AGENCY_SLUG: z.string().min(1, 'LOXO_AGENCY_SLUG is required'),
});
export function validateEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:', result.error.format());
        process.exit(1);
    }
    return result.data;
}
