import { jest } from '@jest/globals';
import { apiTool } from '../last-100.js';

global.fetch = jest.fn();
const mockResponse = {
  last_update: 1718000000,
  total_items: 3,
  current_items: 3,
  data: [
    { id: 'news_1', title: 'Market rallies', timestamp: 1717999900, content: 'Tech stocks up', symbols: ['AAPL'] },
    { id: 'news_2', title: 'Fed pause', timestamp: 1717999800, content: 'Fed signals pause', symbols: ['SPY'] },
    { id: 'news_3', title: 'Oil drops', timestamp: 1717999700, content: 'Oil down', symbols: ['XOM'] }
  ]
};

describe('last-100', () => {
  beforeEach(() => {
    process.env.INSIGHTSENTRY_BASE_URL = 'https://api.insightsentry.com';
    process.env.INSIGHTSENTRY_API_KEY = 'test-api-key';
    fetch.mockClear();
  });

  it('calls fetch with correct URL and headers (no keywords)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });
    const result = await apiTool.function({});
    expect(fetch).toHaveBeenCalledWith(
      'https://api.insightsentry.com/v2/newsfeed/latest',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'x-rapidapi-key': 'test-api-key' })
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('calls fetch with keywords param', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });
    await apiTool.function({ keywords: 'earnings' });
    expect(fetch.mock.calls[0][0]).toContain('keywords=earnings');
  });

  it('returns error object on fetch error', async () => {
    fetch.mockRejectedValueOnce(new Error('fail'));
    const result = await apiTool.function({});
    expect(result).toHaveProperty('error');
  });

  it('returns error object on non-ok response', async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'bad' }) });
    const result = await apiTool.function({});
    expect(result).toHaveProperty('error');
  });

  it('response matches schema', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });
    const result = await apiTool.function({});
    expect(typeof result.last_update).toBe('number');
    expect(typeof result.total_items).toBe('number');
    expect(typeof result.current_items).toBe('number');
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.data[0]).toBe('object');
  });
}); 