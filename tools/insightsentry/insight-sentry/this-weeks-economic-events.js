/**
 * Function to retrieve this week's economic events from InsightSentry.
 *
 * @returns {Promise<Object>} - The result of the economic events retrieval.
 */
const executeFunction = async () => {
  const baseUrl = 'https://insightsentry.p.rapidapi.com';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL for the request
    const url = `${baseUrl}/v2/events/economy/weekly`;

    // Set up headers for the request
    const headers = {
      'x-rapidapi-key': apiKey,
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
    console.error('Error retrieving economic events:', error);
    return { error: 'An error occurred while retrieving economic events.' };
  }
};

/**
 * Tool configuration for retrieving this week's economic events from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_weekly_economic_events',
      description: 'Retrieve this week\'s economic events.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
};

export { apiTool };