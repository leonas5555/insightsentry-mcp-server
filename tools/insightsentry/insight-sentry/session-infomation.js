/**
 * Function to retrieve session information for a specific stock symbol.
 *
 * @param {Object} args - Arguments for the session information request.
 * @param {string} args.symbol - The stock symbol to retrieve session information for.
 * @returns {Promise<Object>} - The session information for the specified stock symbol.
 */
const executeFunction = async ({ symbol }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the symbol path variable
    const url = `${baseUrl}/v2/symbols/${symbol}/session`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey
    };

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error retrieving session information:', error);
    return { error: 'An error occurred while retrieving session information.' };
  }
};

/**
 * Tool configuration for retrieving session information for a stock symbol.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_session_information',
      description: 'Retrieve session information for a specific stock symbol.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to retrieve session information for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { apiTool };