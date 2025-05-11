/**
 * Function to fetch recent bulk data metrics for a specified stock exchange.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.exchange - The stock exchange code (e.g., NASDAQ).
 * @returns {Promise<Object>} - The result of the metrics request.
 */
const executeFunction = async ({ exchange }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the exchange path variable
    const url = new URL(`${baseUrl}/v2/exchanges/${exchange}/metrics`);

    // Set up headers for the request
    const headers = {
      'X-RapidAPI-Key': apiKey
    };

    // Perform the fetch request
    const response = await fetch(url.toString(), {
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
    console.error('Error fetching recent bulk data metrics:', error);
    return { error: 'An error occurred while fetching metrics data.' };
  }
};

/**
 * Tool configuration for fetching recent bulk data metrics for a stock exchange.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'fetch_recent_bulk_data_metrics',
      description: 'Fetch recent bulk data metrics for a specified stock exchange.',
      parameters: {
        type: 'object',
        properties: {
          exchange: {
            type: 'string',
            description: 'The stock exchange code (e.g., NASDAQ).'
          }
        },
        required: ['exchange']
      }
    }
  }
};

export { apiTool };