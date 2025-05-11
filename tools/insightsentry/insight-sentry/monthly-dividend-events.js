/**
 * Function to retrieve monthly dividend events from InsightSentry.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} [args.month='this'] - The month for which to retrieve dividend events.
 * @returns {Promise<Array>} - The list of monthly dividend events.
 */
const executeFunction = async ({ month = 'this' }) => {
  const baseUrl = ''; // will be provided by the user
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v2/events/dividends/monthly`);
    url.searchParams.append('month', month);

    // Set up headers for the request
    const headers = {
      'x-rapidapi-key': apiKey
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
    console.error('Error retrieving monthly dividend events:', error);
    return { error: 'An error occurred while retrieving monthly dividend events.' };
  }
};

/**
 * Tool configuration for retrieving monthly dividend events from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'monthly_dividend_events',
      description: 'Retrieve monthly dividend events from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'string',
            description: 'The month for which to retrieve dividend events.'
          }
        },
        required: []
      }
    }
  }
};

export { apiTool };