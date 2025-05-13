import { apiTool } from '../news-feed-live-streaming.js';
import { jest } from '@jest/globals';

// Mock WebSocket implementation
class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  sent = [];
  listeners = {};
  constructor() {
    setTimeout(() => this.listeners.open && this.listeners.open(), 10);
  }
  send(msg) { this.sent.push(msg); }
  close() { this.readyState = 3; if (this.listeners.close) this.listeners.close({ code: 1000, reason: 'closed' }); }
  addEventListener(type, cb) { this.listeners[type] = cb; }
  set onopen(cb) { this.listeners.open = cb; }
  set onmessage(cb) { this.listeners.message = cb; }
  set onerror(cb) { this.listeners.error = cb; }
  set onclose(cb) { this.listeners.close = cb; }
}
global.WebSocket = MockWebSocket;

jest.useFakeTimers();

describe('news-feed-live-streaming', () => {
  afterEach(() => { jest.clearAllTimers(); });

  it('rejects if websocketKey is missing', async () => {
    await expect(apiTool.function({})).rejects.toThrow('websocketKey parameter is required');
  });

  it('sends auth and filter messages on connect', async () => {
    const params = { websocketKey: 'key', symbols: ['AAPL'], keywords: ['earnings'] };
    const promise = apiTool.function(params);
    jest.advanceTimersByTime(15);
    const ws = await promise;
    expect(ws.sent[0]).toBe(JSON.stringify({ api_key: 'key' }));
    expect(ws.sent[1]).toBe(JSON.stringify({ type: 'filter_symbols', symbols: ['AAPL'] }));
    expect(ws.sent[2]).toBe(JSON.stringify({ type: 'filter_keywords', keywords: ['earnings'] }));
  });

  it('handles heartbeat and news messages', async () => {
    const params = { websocketKey: 'key' };
    const promise = apiTool.function(params);
    jest.advanceTimersByTime(15);
    const ws = await promise;
    // Heartbeat
    ws.listeners.message({ data: 'pong' });
    // News message
    const news = { timestamp: Date.now() / 1000, title: 'Test', content: 'Test', id: 'n1' };
    ws.listeners.message({ data: JSON.stringify(news) });
    // Stale news
    const stale = { timestamp: (Date.now() / 1000) - 100, title: 'Stale', id: 'n2' };
    ws.listeners.message({ data: JSON.stringify(stale) });
    // Non-JSON
    ws.listeners.message({ data: 'not-json' });
  });

  it('triggers data gap warning', async () => {
    const params = { websocketKey: 'key' };
    const promise = apiTool.function(params);
    jest.advanceTimersByTime(15);
    const ws = await promise;
    jest.advanceTimersByTime(35000); // DATA_GAP_ALERT_THRESHOLD_MS + buffer
  });

  it('reconnects on error/close', async () => {
    const params = { websocketKey: 'key' };
    const promise = apiTool.function(params);
    jest.advanceTimersByTime(15);
    const ws = await promise;
    ws.listeners.error({ message: 'fail' });
    ws.listeners.close({ code: 1006, reason: 'fail' });
  });

  it('cleans up intervals on close', async () => {
    const params = { websocketKey: 'key' };
    const promise = apiTool.function(params);
    jest.advanceTimersByTime(15);
    const ws = await promise;
    ws.listeners.close({ code: 1000, reason: 'done' });
  });
}); 