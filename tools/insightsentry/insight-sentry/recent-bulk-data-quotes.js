/**
 * Function to fetch recent bulk data quotes from a specified stock exchange.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.exchange - The stock exchange to fetch quotes from (e.g., "NASDAQ").
 * @returns {Promise<Object>} - The performance-related information of all stocks from the specified exchange.
 */
const executeFunction = async ({ exchange }) => {
  const baseUrl = ''; // will be provided by the user
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the exchange path variable
    const url = `${baseUrl}/v2/exchanges/${exchange}/quotes`;

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
    console.error('Error fetching recent bulk data quotes:', error);
    return { error: 'An error occurred while fetching recent bulk data quotes.' };
  }
};

/**
 * Tool configuration for fetching recent bulk data quotes from a stock exchange.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'fetch_recent_bulk_data_quotes',
      description: 'Fetch recent bulk data quotes from a specified stock exchange.',
      parameters: {
        type: 'object',
        properties: {
          exchange: {
            type: 'string',
            description: 'The stock exchange to fetch quotes from (e.g., "NASDAQ").'
          }
        },
        required: ['exchange']
      }
    }
  }
};

export { apiTool };