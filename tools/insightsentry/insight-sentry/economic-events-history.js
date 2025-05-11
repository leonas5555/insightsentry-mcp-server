/**
 * Function to retrieve the economic events history based on the provided event ID.
 *
 * @param {Object} args - Arguments for the event history retrieval.
 * @param {string} args.id - The ID of the event to retrieve history for.
 * @returns {Promise<Object>} - The result of the economic events history retrieval.
 */
const executeFunction = async ({ id }) => {
  const baseUrl = 'https://insightsentry.p.rapidapi.com';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with the event ID
    const url = `${baseUrl}/v2/events/economy/${id}/history`;

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
    console.error('Error retrieving economic events history:', error);
    return { error: 'An error occurred while retrieving economic events history.' };
  }
};

/**
 * Tool configuration for retrieving economic events history.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_economic_events_history',
      description: 'Retrieve the economic events history based on the provided event ID.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the event to retrieve history for.'
          }
        },
        required: ['id']
      }
    }
  }
};

export { apiTool };