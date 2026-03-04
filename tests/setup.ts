// Set fake env vars before any module import attempts to validate them
process.env.LOXO_API_KEY = 'test-api-key';
process.env.LOXO_AGENCY_SLUG = 'test-agency';
process.env.LOXO_DOMAIN = 'app.loxo.co';
