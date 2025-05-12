/**
 * Function to connect to the Real-Time Data Feed for Series or Quote type data via WebSocket.
 *
 * @param {Object} params - Parameters for the connection
 * @param {string} params.symbol - Symbol to stream data for
 * @param {string} [params.interval='1Min'] - Time interval for data
 * @param {boolean} [params.dadj=false] - Apply dividend adjustment to price series
 * @param {boolean} [params.recent_bars=false] - Include up to 15 recent bars on connect
 * @param {string} params.websocketKey - WebSocket API key (required, distinct from REST API key)
 * @returns {Promise<WebSocket>} - A promise that resolves with the WebSocket connection
 */
const executeFunction = async (params = {}) => {
  const wsUrl = 'wss://realtime.insightsentry.com/live';
  const { symbol, interval = '1Min', dadj = false, recent_bars = false, websocketKey } = params;
  
  if (!symbol) {
    return Promise.reject(new Error('Symbol parameter is required for real-time data stream.'));
  }
  if (!websocketKey) {
    return Promise.reject(new Error('websocketKey parameter is required for real-time data stream.'));
  }

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`[RealTimeDataTool] WebSocket connection established for ${symbol}. Subscribing...`);
      // Send authentication message upon connection
      socket.send(JSON.stringify({ 
        type: 'auth', 
        api_key: websocketKey 
      }));
      
      // Send subscription message with symbol, interval, dadj, and recent_bars
      const subscriptionMessage = {
        type: 'subscribe',
        code: symbol, // 'code' is the expected field for symbol
        bar_type: interval.toLowerCase().replace('min', 'm').replace('h', 'h').replace('d', 'd'),
        dadj: dadj,
        recent_bars: recent_bars
      };
      // Remove undefined or default fields
      if (!dadj) delete subscriptionMessage.dadj;
      if (!recent_bars) delete subscriptionMessage.recent_bars;
      if (!interval || interval === '1Min') delete subscriptionMessage.bar_type;
      socket.send(JSON.stringify(subscriptionMessage));
      console.log(`[RealTimeDataTool] Subscription message sent for ${symbol}:`, subscriptionMessage);
      
      // Resolve with the socket instance
      resolve(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.series) {
          // Bar series response
          console.log(`[RealTimeDataTool] Bar series for ${symbol}:`, data);
        } else if (data.last_price !== undefined) {
          // Quote response
          console.log(`[RealTimeDataTool] Quote for ${symbol}:`, data);
        } else {
          // Other message
          console.log(`[RealTimeDataTool] Message for ${symbol}:`, data);
        }
      } catch (e) {
        console.log(`[RealTimeDataTool] Non-JSON message for ${symbol}:`, event.data);
      }
    };

    socket.onerror = (error) => {
      console.error(`[RealTimeDataTool] WebSocket error for ${symbol}:`, error);
      reject(error);
    };

    socket.onclose = () => {
      console.log(`[RealTimeDataTool] WebSocket connection closed for ${symbol}.`);
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
      description: 'Connect to the Real-Time Data Feed for Series or Quote type data via WebSocket. Supports dividend adjustment and initial bar history. Requires a WebSocket API key.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol to stream data for (e.g., AAPL)'
          },
          interval: {
            type: 'string',
            description: 'Time interval for data (e.g., 1Min, 5Min, 15Min, 1H, 1D)',
            default: '1Min'
          },
          dadj: {
            type: 'boolean',
            description: 'Apply dividend adjustment to all price values',
            default: false
          },
          recent_bars: {
            type: 'boolean',
            description: 'Include up to 15 most recent complete bars with the initial response',
            default: false
          },
          websocketKey: {
            type: 'string',
            description: 'WebSocket API key (required, distinct from REST API key)'
          }
        },
        required: ['symbol', 'websocketKey']
      }
    }
  }
};

export { apiTool };