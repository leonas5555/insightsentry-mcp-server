/**
 * Function to connect to the Real-Time Data Feed for Series or Quote type data via WebSocket.
 *
 * @param {Object} params - Parameters for the connection
 * @param {string} params.symbol - Symbol to stream data for
 * @param {string} [params.interval='1Min'] - Time interval for data
 * @returns {Promise<WebSocket>} - A promise that resolves with the WebSocket connection
 */
const executeFunction = async (params = {}) => {
  const wsUrl = process.env.INSIGHTSENTRY_WS_URL || 'wss://stream.insightsentry.com/quote';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  const { symbol, interval = '1Min' } = params;
  
  if (!symbol) {
    return Promise.reject(new Error('Symbol parameter is required for real-time data stream.'));
  }

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`[RealTimeDataTool] WebSocket connection established for ${symbol}. Subscribing...`);
      // Send authentication message upon connection
      socket.send(JSON.stringify({ 
        type: 'auth', 
        api_key: apiKey 
      }));
      
      // Send subscription message with symbol and interval
      const subscriptionMessage = {
        type: 'subscribe',
        symbol: symbol,
        interval: interval
      };
      socket.send(JSON.stringify(subscriptionMessage));
      console.log(`[RealTimeDataTool] Subscription message sent for ${symbol}:`, subscriptionMessage);
      
      // Resolve with the socket instance
      resolve(socket);
    };

    socket.onmessage = (event) => {
      console.log(`[RealTimeDataTool] Message from server for ${symbol}:`, event.data);
      // Handle incoming messages here
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
      description: 'Connect to the Real-Time Data Feed for Series or Quote type data via WebSocket.',
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
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { apiTool };