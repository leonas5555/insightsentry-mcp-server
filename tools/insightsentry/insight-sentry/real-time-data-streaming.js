/**
 * Function to connect to the Real-Time Data Feed for Series or Quote type data via WebSocket.
 *
 * @returns {Promise<void>} - A promise that resolves when the connection is established.
 */
const executeFunction = async () => {
  const url = 'wss://realtime.insightsentry.com/live';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connection established.');
      // You can send authentication or other messages here if needed
      // Example: socket.send(JSON.stringify({ type: 'auth', apiKey }));
      resolve();
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
      // Handle incoming messages here
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed.');
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
        properties: {},
        required: []
      }
    }
  }
};

export { apiTool };