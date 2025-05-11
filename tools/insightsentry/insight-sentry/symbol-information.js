/**
 * Function to retrieve information about a specific symbol from InsightSentry.
 *
 * @param {Object} args - Arguments for the symbol information retrieval.
 * @param {string} args.symbol - The symbol code for which to retrieve information (e.g., 'NASDAQ:AAPL').
 * @returns {Promise<Object>} - The result of the symbol information retrieval.
 */
const executeFunction = async ({ symbol }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the symbol path variable
    const url = `${baseUrl}/v2/symbols/${encodeURIComponent(symbol)}/info`;

    // Set up headers for the request
    const headers = {
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
    console.error('Error retrieving symbol information:', error);
    return { error: 'An error occurred while retrieving symbol information.' };
  }
};

/**
 * Tool configuration for retrieving symbol information from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_symbol_info',
      description: 'Retrieve information about a specific symbol from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The symbol code for which to retrieve information (e.g., "NASDAQ:AAPL").'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { apiTool };