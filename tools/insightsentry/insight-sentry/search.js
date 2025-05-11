/**
 * Function to search for stock information using InsightSentry API.
 *
 * @param {Object} args - Arguments for the search.
 * @param {string} args.query - The search query for stock symbols.
 * @param {string} [args.type="stocks"] - The type of asset to search for (e.g., stocks, crypto).
 * @returns {Promise<Object>} - The result of the stock search.
 */
const executeFunction = async ({ query, type = 'stocks' }) => {
  const baseUrl = 'https://insightsentry.p.rapidapi.com';
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v2/symbols/search`);
    url.searchParams.append('query', query);
    url.searchParams.append('type', type);

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
    console.error('Error searching for stocks:', error);
    return { error: 'An error occurred while searching for stocks.' };
  }
};

/**
 * Tool configuration for searching stocks using InsightSentry API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'search_stocks',
      description: 'Search for stock information using InsightSentry API.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query for stock symbols.'
          },
          type: {
            type: 'string',
            enum: ['crypto', 'index', 'forex', 'futures', 'funds', 'stocks'],
            description: 'The type of asset to search for.'
          }
        },
        required: ['query']
      }
    }
  }
};

export { apiTool };