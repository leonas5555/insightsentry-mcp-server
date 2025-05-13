import { getWebSocketKey } from '../get-websocket-key.js';
import { jest } from '@jest/globals';

global.fetch = jest.fn();

describe('get-websocket-key', () => {
  beforeEach(() => { fetch.mockClear(); });

  it('throws if restApiKey is missing', async () => {
    await expect(getWebSocketKey({})).rejects.toThrow('restApiKey parameter is required');
  });

  it('calls correct endpoint and headers', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ websocket_key: 'ws-key' }) });
    const key = await getWebSocketKey({ restApiKey: 'rest-key' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.insightsentry.com/v2/websocket-key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer rest-key',
          Accept: 'application/json'
        })
      })
    );
    expect(key).toBe('ws-key');
  });

  it('throws if websocket_key missing in response', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(getWebSocketKey({ restApiKey: 'rest-key' })).rejects.toThrow('websocket_key not found in response');
  });

  it('throws on HTTP error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) });
    await expect(getWebSocketKey({ restApiKey: 'rest-key' })).rejects.toThrow('Failed to obtain WebSocket API key: 401 Unauthorized');
  });

  it('throws on fetch error', async () => {
    fetch.mockRejectedValueOnce(new Error('fail'));
    await expect(getWebSocketKey({ restApiKey: 'rest-key' })).rejects.toThrow('Error obtaining WebSocket API key: fail');
  });
}); 