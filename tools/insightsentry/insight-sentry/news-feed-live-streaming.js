/**
 * Function to connect to the Live Streaming News Feed via WebSocket.
 *
 * @param {Object} params - Parameters for the connection
 * @param {Array<string>} [params.symbols] - Array of symbols to filter news for
 * @param {Array<string>} [params.keywords] - Array of keywords to filter news for
 * @param {string} params.websocketKey - WebSocket API key (required, distinct from REST API key)
 * @returns {Promise<WebSocket>} - The WebSocket connection to the news feed.
 */
const INITIAL_RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_DELAY = 10000; // 10 seconds
const STALE_NEWS_THRESHOLD_MS = 10000; // 10 seconds
const DATA_GAP_ALERT_THRESHOLD_MS = 30000; // 30 seconds

const executeFunction = async (params = {}) => {
  const wsUrl = 'wss://newsfeed.insightsentry.com/newsfeed';
  const { symbols, keywords, websocketKey } = params;

  if (!websocketKey) {
    return Promise.reject(new Error('websocketKey parameter is required for news feed streaming.'));
  }

  let ws;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;
  let shouldReconnect = true;
  let lastNewsTimestamp = Date.now();
  let dataGapInterval = null;
  let pingInterval = null;

  function startDataGapMonitor() {
    if (dataGapInterval) clearInterval(dataGapInterval);
    dataGapInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastNewsTimestamp > DATA_GAP_ALERT_THRESHOLD_MS) {
        console.warn(`[NewsFeedTool] WARNING: No news received for over ${DATA_GAP_ALERT_THRESHOLD_MS / 1000}s! Possible data gap.`);
      }
    }, 5000);
  }

  function stopDataGapMonitor() {
    if (dataGapInterval) {
      clearInterval(dataGapInterval);
      dataGapInterval = null;
    }
  }

  return new Promise((resolve, reject) => {
    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[NewsFeedTool] WebSocket connection established. Authenticating...');
        reconnectDelay = INITIAL_RECONNECT_DELAY; // Reset delay on successful connect
        // Send authentication message upon connection
        ws.send(JSON.stringify({ api_key: websocketKey }));
        // Apply filters if provided
        if (symbols && symbols.length > 0) {
          console.log(`[NewsFeedTool] Setting symbol filter: ${symbols.join(', ')}`);
          ws.send(JSON.stringify({ 
            type: 'filter_symbols', 
            symbols: symbols 
          }));
        }
        if (keywords && keywords.length > 0) {
          console.log(`[NewsFeedTool] Setting keyword filter: ${keywords.join(', ')}`);
          ws.send(JSON.stringify({ 
            type: 'filter_keywords', 
            keywords: keywords 
          }));
        }
        console.log('[NewsFeedTool] Authentication and filters complete.');
        lastNewsTimestamp = Date.now();
        startDataGapMonitor();
        // Start ping keep-alive
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
        resolve(ws);
      };

      ws.onmessage = (event) => {
        lastNewsTimestamp = Date.now();
        // Heartbeat/keep-alive handling
        if (event.data === 'pong') {
          console.log('[NewsFeedTool] Received pong from server');
          return;
        }
        try {
          const data = JSON.parse(event.data);
          if (data && data.server_time) {
            // Server heartbeat message
            // Optionally log or update lastNewsTimestamp
            return;
          }
          let newsTimestamp = null;
          if (data.timestamp) {
            // Assume 'timestamp' is UNIX timestamp in seconds or ms
            newsTimestamp = data.timestamp > 1e12 ? data.timestamp : data.timestamp * 1000;
          }
          if (newsTimestamp && (Date.now() - newsTimestamp > STALE_NEWS_THRESHOLD_MS)) {
            console.warn(`[NewsFeedTool] Stale news received (age: ${((Date.now() - newsTimestamp)/1000).toFixed(1)}s), discarding:`, data);
            return;
          }
          console.log('[NewsFeedTool] Message from news feed:', data);
        } catch (e) {
          console.log('[NewsFeedTool] Non-JSON message from news feed:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('[NewsFeedTool] WebSocket error:', error.message);
        ws.close();
      };

      ws.onclose = (event) => {
        stopDataGapMonitor();
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = null;
        if (!shouldReconnect) return;
        console.log(`[NewsFeedTool] WebSocket closed (code: ${event.code}, reason: ${event.reason}). Reconnecting in ${reconnectDelay / 1000}s...`);
        setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
          connect();
        }, reconnectDelay);
      };
    }

    connect();
  });
};

/**
 * Tool configuration for connecting to the Live Streaming News Feed.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'connect_news_feed',
      description: 'Connect to the Live Streaming News Feed via WebSocket. Requires a WebSocket API key.',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of symbols to filter news for (e.g., ["AAPL", "MSFT"])'
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of keywords to filter news for (e.g., ["earnings", "merger"])'
          },
          websocketKey: {
            type: 'string',
            description: 'WebSocket API key (required, distinct from REST API key)'
          }
        },
        required: ['websocketKey']
      }
    }
  }
};

export { apiTool };