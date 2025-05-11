/**
 * Function to retrieve available exchanges for Stock Bulk Data from InsightSentry.
 *
 * @returns {Promise<Object>} - The result of the available exchanges request.
 */
const executeFunction = async () => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL for the request
    const url = `${baseUrl}/v2/exchanges`;

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
    console.error('Error retrieving available exchanges:', error);
    return { error: 'An error occurred while retrieving available exchanges.' };
  }
};

/**
 * Tool configuration for retrieving available exchanges from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_available_exchanges',
      description: 'Retrieve available exchanges for Stock Bulk Data.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
};

export { apiTool };