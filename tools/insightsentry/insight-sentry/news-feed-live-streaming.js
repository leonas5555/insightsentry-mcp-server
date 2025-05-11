/**
 * Function to connect to the Live Streaming News Feed via WebSocket.
 *
 * @returns {Promise<WebSocket>} - The WebSocket connection to the news feed.
 */
const executeFunction = async () => {
  const url = 'wss://newsfeed.insightsentry.com/newsfeed';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      // Send authentication message upon connection
      socket.send(JSON.stringify({ api_key: apiKey }));
      resolve(socket);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(new Error('WebSocket connection error.'));
    };

    socket.onclose = (event) => {
      console.log('WebSocket closed:', event);
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
      description: 'Connect to the Live Streaming News Feed via WebSocket.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
};

export { apiTool };