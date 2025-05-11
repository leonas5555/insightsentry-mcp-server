/**
 * Function to fetch financial data for a specific stock symbol from InsightSentry.
 *
 * @param {Object} args - Arguments for the financial data request.
 * @param {string} args.symbol - The stock symbol to fetch financial data for.
 * @returns {Promise<Object>} - The financial data for the specified stock symbol.
 */
const executeFunction = async ({ symbol }) => {
  const baseUrl = 'https://insightsentry.p.rapidapi.com';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the stock symbol
    const url = `${baseUrl}/v2/symbols/${symbol}/financials`;

    // Set up headers for the request
    const headers = {
      'x-rapidapi-key': apiKey
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
    console.error('Error fetching financial data:', error);
    return { error: 'An error occurred while fetching financial data.' };
  }
};

/**
 * Tool configuration for fetching financial data from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'fetch_financial_data',
      description: 'Fetch financial data for a specific stock symbol from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch financial data for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { apiTool };