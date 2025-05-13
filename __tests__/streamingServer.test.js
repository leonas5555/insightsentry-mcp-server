import { jest } from '@jest/globals';
import WebSocket from 'ws';
import http from 'http';

await jest.unstable_mockModule('../tools/insightsentry/insight-sentry/news-feed-live-streaming.js', () => ({
  apiTool: {
    definition: { function: { name: 'connect_news_feed' } },
    function: jest.fn(() => Promise.resolve({
      onmessage: null, onerror: null, onclose: null, readyState: 1,
      send: jest.fn(), close: jest.fn()
    }))
  }
}));
await jest.unstable_mockModule('../tools/insightsentry/insight-sentry/real-time-data-streaming.js', () => ({
  apiTool: {
    definition: { function: { name: 'connect_real_time_data_stream' } },
    function: jest.fn(() => Promise.resolve({
      onmessage: null, onerror: null, onclose: null, readyState: 1,
      send: jest.fn(), close: jest.fn()
    }))
  }
}));

const { default: server } = await import('../streamingServer.js');

describe('streamingServer', () => {
  afterAll(() => { if (server && server.close) server.close(); });

  it('responds to /health', async () => {
    const res = await fetch('http://localhost:3002/health');
    const json = await res.json();
    expect(json).toHaveProperty('status', 'ok');
  });

  it('rejects unknown tool', (done) => {
    const ws = new WebSocket('ws://localhost:3002/unknown_tool');
    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      expect(data).toHaveProperty('error');
      ws.close();
      done();
    });
  });

  it('routes to correct tool and pipes messages', (done) => {
    const ws = new WebSocket('ws://localhost:3002/connect_news_feed?symbols=["AAPL"]');
    ws.on('open', () => {
      ws.send('test');
      setTimeout(() => {
        if (ws.readyState !== ws.CLOSED) ws.close();
      }, 100);
    });
    ws.on('close', () => done());
    ws.on('error', () => done());
  });

  it('handles client disconnect', (done) => {
    const ws = new WebSocket('ws://localhost:3002/connect_news_feed');
    ws.on('open', () => ws.close());
    ws.on('close', () => done());
  });

  it('shuts down on SIGINT', (done) => {
    process.emit('SIGINT');
    setTimeout(done, 100);
  });
}); 