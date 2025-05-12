/**
 * Function to connect to the Live Streaming News Feed via WebSocket.
 *
 * @param {Object} params - Parameters for the connection
 * @param {Array<string>} [params.symbols] - Array of symbols to filter news for
 * @param {Array<string>} [params.keywords] - Array of keywords to filter news for
 * @param {string} params.websocketKey - WebSocket API key (required, distinct from REST API key)
 * @returns {Promise<WebSocket>} - The WebSocket connection to the news feed.
 */
const executeFunction = async (params = {}) => {
  const wsUrl = 'wss://newsfeed.insightsentry.com/newsfeed';
  const { symbols, keywords, websocketKey } = params;

  if (!websocketKey) {
    return Promise.reject(new Error('websocketKey parameter is required for news feed streaming.'));
  }

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[NewsFeedTool] WebSocket connection established. Authenticating...');
      // Send authentication message upon connection
      socket.send(JSON.stringify({ api_key: websocketKey }));
      
      // Apply filters if provided
      if (symbols && symbols.length > 0) {
        console.log(`[NewsFeedTool] Setting symbol filter: ${symbols.join(', ')}`);
        socket.send(JSON.stringify({ 
          type: 'filter_symbols', 
          symbols: symbols 
        }));
      }
      
      if (keywords && keywords.length > 0) {
        console.log(`[NewsFeedTool] Setting keyword filter: ${keywords.join(', ')}`);
        socket.send(JSON.stringify({ 
          type: 'filter_keywords', 
          keywords: keywords 
        }));
      }
      
      console.log('[NewsFeedTool] Authentication and filters complete.');
      resolve(socket);
    };

    socket.onmessage = (event) => {
      console.log('[NewsFeedTool] Message from news feed:', event.data);
      // Handle incoming messages here (if needed)
    };

    socket.onerror = (error) => {
      console.error('[NewsFeedTool] WebSocket error:', error);
      reject(new Error('WebSocket connection error.'));
    };

    socket.onclose = (event) => {
      console.log('[NewsFeedTool] WebSocket closed:', event);
    };
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