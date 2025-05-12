/**
 * Function to connect to the Real-Time Data Feed for Series or Quote type data via WebSocket.
 *
 * @param {Object} params - Parameters for the connection
 * @param {Array<Object>} params.subscriptions - Array of subscription objects, each with {code, type, bar_type, bar_interval}
 * @param {string} params.websocketKey - WebSocket API key (required, distinct from REST API key)
 * @returns {Promise<WebSocket>} - A promise that resolves with the WebSocket connection
 */
const executeFunction = async (params = {}) => {
  const wsUrl = 'wss://realtime.insightsentry.com/live';
  const { subscriptions, websocketKey } = params;

  if (!subscriptions) {
    return Promise.reject(new Error('subscriptions array is required for real-time data stream.'));
  }
  if (!websocketKey) {
    return Promise.reject(new Error('websocketKey parameter is required for real-time data stream.'));
  }

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`[RealTimeDataTool] WebSocket connection established. Subscribing...`);
      // Send authentication message upon connection
      socket.send(
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
      socket.send(JSON.stringify(subscriptionMessage));
      console.log(`[RealTimeDataTool] Subscriptions message sent:`, subscriptionMessage);

      // Resolve with the socket instance
      resolve(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.series) {
          // Bar series response
          console.log(`[RealTimeDataTool] Bar series:`, data);
        } else if (data.last_price !== undefined) {
          // Quote response
          console.log(`[RealTimeDataTool] Quote:`, data);
        } else {
          // Other message
          console.log(`[RealTimeDataTool] Message:`, data);
        }
      } catch (e) {
        console.log(`[RealTimeDataTool] Non-JSON message:`, event.data);
      }
    };

    socket.onerror = (error) => {
      console.error(`[RealTimeDataTool] WebSocket error:`, error);
      reject(error);
    };

    socket.onclose = () => {
      console.log(`[RealTimeDataTool] WebSocket connection closed.`);
    };
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