/**
 * Function to retrieve the live news feed from InsightSentry for the last 24 hours.
 *
 * @param {Object} args - Arguments for the news feed retrieval.
 * @param {number} [args.limit=5000] - The maximum number of news items to return (default is 5000).
 * @param {number} [args.page=1] - The page number to return (default is 1).
 * @param {string} [args.keywords] - Optional keywords to filter news items by title or content.
 * @returns {Promise<Object>} - The result of the news feed retrieval.
 */
const executeFunction = async ({ keywords = '', limit = 20, page = 1 }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v2/newsfeed`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('page', page.toString());
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
 * Tool configuration for retrieving the live news feed from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'retrieve_live_news_feed',
      description: 'Retrieve the live news feed for the last 24 hours.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'The maximum number of news items to return.'
          },
          page: {
            type: 'integer',
            description: 'The page number to return.'
          },
          keywords: {
            type: 'string',
            description: 'Optional keywords to filter news items by title or content.'
          }
        },
        required: []
      }
    }
  }
};

export { apiTool };