/**
 * Function to retrieve the latest live news feed from InsightSentry.
 *
 * @param {Object} args - Arguments for the news feed retrieval.
 * @param {string} [args.keywords] - Optional keywords to filter news items by title or content, separated by commas.
 * @returns {Promise<Object>} - The result of the news feed retrieval, including last update timestamp, total items, and news data.
 */
const executeFunction = async ({ keywords = '' }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v2/newsfeed/latest`);
    if (keywords) {
      url.searchParams.append('keywords', keywords);
    }

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
    console.error('Error retrieving news feed:', error);
    return { error: 'An error occurred while retrieving the news feed.' };
  }
};

/**
 * Tool configuration for retrieving the latest news feed from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'retrieve_latest_news',
      description: 'Retrieve the latest live news feed from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'string',
            description: 'Optional keywords to filter news items by title or content.'
          }
        }
      }
    }
  }
};

export { apiTool };