/**
 * Function to get the latest quote for a given symbol code from InsightSentry.
 *
 * @param {Object} args - Arguments for the quote request.
 * @param {string} args.symbol - The symbol code for which to retrieve the latest quote.
 * @returns {Promise<Object>} - The latest quote data for the specified symbol.
 */
const executeFunction = async ({ symbol }) => {
  const baseUrl = 'https://insightsentry.p.rapidapi.com';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the symbol path variable
    const url = `${baseUrl}/v2/symbols/${encodeURIComponent(symbol)}/quote`;

    // Set up headers for the request
    const headers = {
      'X-RapidAPI-Key': apiKey,
      'Content-Type': 'application/json'
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
    console.error('Error fetching the latest quote:', error);
    return { error: 'An error occurred while fetching the latest quote.' };
  }
};

/**
 * Tool configuration for getting the latest quote from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_latest_quote',
      description: 'Get the latest quote for a given symbol code from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The symbol code for which to retrieve the latest quote.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { apiTool };