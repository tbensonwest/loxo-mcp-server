import { describe, it, expect } from 'vitest';
import { truncateResponse, formatResponse } from '../src/server.js';

describe('truncateResponse', () => {
  it('returns full text when under the limit', () => {
    const input = 'hello world';
    const result = truncateResponse(input);
    expect(result.text).toBe('hello world');
    expect(result.wasTruncated).toBe(false);
  });

  it('truncates text that exceeds the limit', () => {
    const longText = 'a'.repeat(300000);
    const result = truncateResponse(longText);
    expect(result.wasTruncated).toBe(true);
    expect(result.text).toContain('[Response truncated');
    expect(result.text.length).toBeLessThan(300000);
  });

  it('respects a custom limit', () => {
    const result = truncateResponse('hello world', 5);
    expect(result.wasTruncated).toBe(true);
    expect(result.text).toContain('[Response truncated');
  });

  it('returns exact limit length content without truncating', () => {
    const input = 'a'.repeat(25000);
    const result = truncateResponse(input, 25000);
    expect(result.wasTruncated).toBe(false);
  });
});

describe('formatResponse', () => {
  const data = { name: 'Jane', id: '1' };

  it('returns JSON string by default', () => {
    const result = formatResponse(data);
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('returns JSON string when format is json', () => {
    const result = formatResponse(data, 'json');
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('returns markdown code block when format is markdown', () => {
    const result = formatResponse(data, 'markdown');
    expect(result).toContain('```json');
    expect(result).toContain('"name": "Jane"');
    expect(result).toContain('```');
  });
});
