/**
 * Function to retrieve available economic data sources from InsightSentry.
 *
 * @returns {Promise<Object>} - The result of the API call containing economic data sources.
 */
const executeFunction = async () => {
  const baseUrl = ''; // will be provided by the user
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL for the API request
    const url = `${baseUrl}/v2/datasets/sources/economy`;

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
    console.error('Error retrieving economic data sources:', error);
    return { error: 'An error occurred while retrieving economic data sources.' };
  }
};

/**
 * Tool configuration for retrieving available economic data sources from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_economic_data_sources',
      description: 'Retrieve available economic data sources from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
};

export { apiTool };