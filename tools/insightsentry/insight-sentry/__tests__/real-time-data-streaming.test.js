import { jest } from '@jest/globals';
import { apiTool } from '../real-time-data-streaming.js';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.sentMessages = [];
    this.eventListeners = {};
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen && this.onopen();
    }, 10);
  }
  send(msg) {
    this.sentMessages.push(msg);
  }
  close() {
    this.readyState = 3;
    this.onclose && this.onclose({ code: 1000, reason: 'closed' });
  }
  addEventListener(event, cb) {
    this.eventListeners[event] = cb;
  }
  triggerMessage(data) {
    this.onmessage && this.onmessage({ data });
  }
  triggerError(error) {
    this.onerror && this.onerror(error);
  }
}

global.WebSocket = MockWebSocket;
jest.useFakeTimers();

describe('real-time-data-streaming', () => {
  const websocketKey = 'test_ws_key';
  const subscriptions = [
    { code: 'NASDAQ:AAPL', type: 'series', bar_type: 'minute', bar_interval: 1 },
    { code: 'NASDAQ:AAPL', type: 'quote' }
  ];

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('rejects if subscriptions or websocketKey missing', async () => {
    await expect(apiTool.function({ websocketKey })).rejects.toThrow();
    await expect(apiTool.function({ subscriptions })).rejects.toThrow();
  });

  it('sends correct auth and subscription messages on connect', async () => {
    const promise = apiTool.function({ subscriptions, websocketKey });
    jest.advanceTimersByTime(20); // Advance timers to trigger setTimeout
    const ws = await promise;
    expect(ws.sentMessages[0]).toBe(JSON.stringify({ type: 'auth', api_key: websocketKey }));
    expect(ws.sentMessages[1]).toBe(
      JSON.stringify({ api_key: websocketKey, subscriptions })
    );
  });

  it('handles valid series data', async () => {
    const promise = apiTool.function({ subscriptions, websocketKey });
    jest.advanceTimersByTime(20);
    const ws = await promise;
    const seriesData = JSON.stringify({
      code: 'NASDAQ:AAPL',
      bar_end: 1733432399,
      last_update: 1733432399820,
      bar_type: '1m',
      series: [
        {
          time: 1733432340,
          open: 242.89,
          high: 243.09,
          low: 242.82,
          close: 243.08,
          volume: 533779
        }
      ]
    });
    // Should log bar series
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    ws.triggerMessage(seriesData);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Bar series:'),
      expect.objectContaining(JSON.parse(seriesData))
    );
    logSpy.mockRestore();
  });

  it('handles valid quote data', async () => {
    const promise = apiTool.function({ subscriptions, websocketKey });
    jest.advanceTimersByTime(20);
    const ws = await promise;
    const quoteData = JSON.stringify({
      code: 'NASDAQ:AAPL',
      lp_time: 1733432340,
      volume: 533779,
      last_price: 243.08,
      change_percent: 0.41,
      change: 979.96,
      ask: 243.09,
      bid: 243.08,
      ask_size: 520.0,
      bid_size: 430.0
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    ws.triggerMessage(quoteData);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Quote:'),
      expect.objectContaining(JSON.parse(quoteData))
    );
    logSpy.mockRestore();
  });

  it('discards stale data and logs warning', async () => {
    const promise = apiTool.function({ subscriptions, websocketKey });
    jest.advanceTimersByTime(20);
    const ws = await promise;
    const now = Date.now();
    const staleSeries = JSON.stringify({
      code: 'NASDAQ:AAPL',
      series: { t: Math.floor((now - 20000) / 1000) } // 20s old
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    ws.triggerMessage(staleSeries);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stale data received'),
      expect.anything()
    );
    warnSpy.mockRestore();
  });

  it('logs non-JSON messages', async () => {
    const promise = apiTool.function({ subscriptions, websocketKey });
    jest.advanceTimersByTime(20);
    const ws = await promise;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    ws.triggerMessage('not-json');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Non-JSON message:'),
      'not-json'
    );
    logSpy.mockRestore();
  });

  it('reconnects on error and close', async () => {
    const promise = apiTool.function({ subscriptions, websocketKey });
    jest.advanceTimersByTime(20);
    const ws = await promise;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    ws.triggerError({ message: 'test error' });
    jest.advanceTimersByTime(2000); // Initial reconnect delay
    // Should log reconnect attempt
    const logCalls = logSpy.mock.calls.flat();
    expect(logCalls.some(msg => msg.includes('WebSocket connection closed') && msg.includes('Reconnecting'))).toBe(true);
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
}); 