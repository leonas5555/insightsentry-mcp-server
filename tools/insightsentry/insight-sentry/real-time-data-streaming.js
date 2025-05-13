/**
 * Function to connect to the Real-Time Data Feed for Series or Quote type data via WebSocket.
 *
 * @param {Object} params - Parameters for the connection
 * @param {Array<Object>} params.subscriptions - Array of subscription objects, each with {code, type, bar_type, bar_interval}
 * @param {string} params.websocketKey - WebSocket API key (required, distinct from REST API key)
 * @returns {Promise<WebSocket>} - A promise that resolves with the WebSocket connection
 */
const INITIAL_RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_DELAY = 10000; // 10 seconds
const STALE_DATA_THRESHOLD_MS = 10000; // 10 seconds
const DATA_GAP_ALERT_THRESHOLD_MS = 15000; // 15 seconds

const executeFunction = async (params = {}) => {
  const wsUrl = 'wss://realtime.insightsentry.com/live';
  const { subscriptions, websocketKey } = params;

  if (!subscriptions) {
    return Promise.reject(new Error('subscriptions array is required for real-time data stream.'));
  }
  if (!websocketKey) {
    return Promise.reject(new Error('websocketKey parameter is required for real-time data stream.'));
  }

  let ws;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;
  let shouldReconnect = true;
  let lastDataTimestamp = Date.now();
  let dataGapInterval = null;
  let pingInterval = null;

  function startDataGapMonitor() {
    if (dataGapInterval) clearInterval(dataGapInterval);
    dataGapInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastDataTimestamp > DATA_GAP_ALERT_THRESHOLD_MS) {
        console.warn(`[RealTimeDataTool] WARNING: No data received for over ${DATA_GAP_ALERT_THRESHOLD_MS / 1000}s! Possible data gap.`);
      }
    }, 2000);
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
        console.log(`[RealTimeDataTool] WebSocket connection established. Subscribing...`);
        reconnectDelay = INITIAL_RECONNECT_DELAY; // Reset delay on successful connect
        // Send authentication message upon connection
        ws.send(
          JSON.stringify({
            type: 'auth',
            api_key: websocketKey
          })
        );
        // Send unified subscriptions message
        const subscriptionMessage = {
          api_key: websocketKey,
          subscriptions: subscriptions
        };
        ws.send(JSON.stringify(subscriptionMessage));
        console.log(`[RealTimeDataTool] Subscriptions message sent:`, subscriptionMessage);
        lastDataTimestamp = Date.now();
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
        lastDataTimestamp = Date.now();
        // Heartbeat/keep-alive handling
        if (event.data === 'pong') {
          console.log('[RealTimeDataTool] Received pong from server');
          return;
        }
        try {
          const data = JSON.parse(event.data);
          if (data && data.server_time) {
            // Server heartbeat message
            // Optionally log or update lastDataTimestamp
            return;
          }
          let dataTimestamp = null;
          if (data.series && data.series.t) {
            // Bar series: assume 't' is UNIX timestamp in seconds
            dataTimestamp = data.series.t * 1000;
          } else if (data.timestamp) {
            // Quote: assume 'timestamp' is UNIX timestamp in seconds or ms
            dataTimestamp = data.timestamp > 1e12 ? data.timestamp : data.timestamp * 1000;
          }
          if (dataTimestamp && (Date.now() - dataTimestamp > STALE_DATA_THRESHOLD_MS)) {
            console.warn(`[RealTimeDataTool] Stale data received (age: ${((Date.now() - dataTimestamp)/1000).toFixed(1)}s), discarding:`, data);
            return;
          }
          if (data.series) {
            console.log(`[RealTimeDataTool] Bar series:`, data);
          } else if (data.last_price !== undefined) {
            console.log(`[RealTimeDataTool] Quote:`, data);
          } else {
            console.log(`[RealTimeDataTool] Message:`, data);
          }
        } catch (e) {
          console.log(`[RealTimeDataTool] Non-JSON message:`, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error(`[RealTimeDataTool] WebSocket error:`, error.message);
        ws.close();
      };

      ws.onclose = (event) => {
        stopDataGapMonitor();
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = null;
        if (!shouldReconnect) return;
        console.log(`[RealTimeDataTool] WebSocket connection closed (code: ${event.code}, reason: ${event.reason}). Reconnecting in ${reconnectDelay / 1000}s...`);
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
 * Tool configuration for connecting to the Real-Time Data Feed.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'connect_real_time_data_stream',
      description:
        'Connect to the Real-Time Data Feed for Series or Quote type data via WebSocket. Supports multiple symbol subscriptions. Requires a WebSocket API key.',
      parameters: {
        type: 'object',
        properties: {
          subscriptions: {
            type: 'array',
            description:
              'Array of subscription objects, each with {code, type, bar_type, bar_interval}. Example: [{"code": "NASDAQ:AAPL", "type": "series", "bar_type": "minute", "bar_interval": 1}, {"code": "NASDAQ:TSLA", "type": "quote"}]',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'Symbol code (e.g., NASDAQ:AAPL)' },
                type: { type: 'string', enum: ['series', 'quote'], description: 'Subscription type: series or quote' },
                bar_type: { type: 'string', description: 'Bar type for series (e.g., minute, hour, day)' },
                bar_interval: { type: 'integer', description: 'Bar interval for series (e.g., 1 for 1-minute bars)' },
                dadj: { type: 'boolean', description: 'Apply dividend adjustment to all price values' },
                recent_bars: { type: 'boolean', description: 'Include up to 15 most recent complete bars with the initial response' }
              },
              required: ['code', 'type']
            }
          },
          websocketKey: {
            type: 'string',
            description: 'WebSocket API key (required, distinct from REST API key)'
          }
        },
        required: ['subscriptions', 'websocketKey']
      }
    }
  }
};

export { apiTool };