/**
 * Function to fetch historical series data for an economic indicator.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.id - The ID of the economic indicator to fetch data for.
 * @returns {Promise<Object>} - The historical series data for the specified economic indicator.
 */
const executeFunction = async ({ id }) => {
  const baseUrl = ''; // will be provided by the user
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the path variable
    const url = `${baseUrl}/v2/datasets/economy/${id}/series`;

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
    console.error('Error fetching economic data:', error);
    return { error: 'An error occurred while fetching economic data.' };
  }
};

/**
 * Tool configuration for fetching historical series data for economic indicators.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'fetch_economic_data',
      description: 'Fetch historical series data for an economic indicator.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the economic indicator to fetch data for.'
          }
        },
        required: ['id']
      }
    }
  }
};

export { apiTool };