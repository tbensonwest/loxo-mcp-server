import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dotenv so the real .env file does not leak into these tests.
// This keeps the config-validation tests deterministic regardless of
// what the developer has in their local .env.
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

describe('validateEnv — LOXO_DEFAULT_OWNER_ID', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.LOXO_API_KEY = 'test-api-key';
    process.env.LOXO_AGENCY_SLUG = 'test-agency';
    process.env.LOXO_DOMAIN = 'app.loxo.co';
    delete process.env.LOXO_DEFAULT_OWNER_ID;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('accepts absence of LOXO_DEFAULT_OWNER_ID', async () => {
    delete process.env.LOXO_DEFAULT_OWNER_ID;
    const { validateEnv } = await import('../src/config.js');
    const env = validateEnv();
    expect(env.LOXO_DEFAULT_OWNER_ID).toBeUndefined();
  });

  it('accepts a numeric string value', async () => {
    process.env.LOXO_DEFAULT_OWNER_ID = '42';
    const { validateEnv } = await import('../src/config.js');
    const env = validateEnv();
    expect(env.LOXO_DEFAULT_OWNER_ID).toBe('42');
  });

  it('rejects a non-numeric value via process.exit(1)', async () => {
    process.env.LOXO_DEFAULT_OWNER_ID = 'not-a-number';
    const { validateEnv } = await import('../src/config.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateEnv()).toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
