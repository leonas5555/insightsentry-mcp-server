/**
 * Function to fetch bulk L1 quotes for specified symbols from InsightSentry.
 *
 * @param {Object} args - Arguments for the quote request.
 * @param {string[]} args.codes - An array of symbol codes (up to 10) to fetch quotes for.
 * @returns {Promise<Object>} - The result of the quote request.
 */
const executeFunction = async ({ codes }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  if (!Array.isArray(codes) || codes.length > 10) {
    throw new Error('You must provide an array of up to 10 symbol codes.');
  }

  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v2/symbols/quotes`);
    url.searchParams.append('codes', codes.join(','));

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
    console.error('Error fetching bulk L1 quotes:', error);
    return { error: 'An error occurred while fetching bulk L1 quotes.' };
  }
};

/**
 * Tool configuration for fetching bulk L1 quotes from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'bulk_l1_quotes',
      description: 'Fetch bulk L1 quotes for specified symbols from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          codes: {
            type: 'array',
            items: {
              type: 'string',
              description: 'The symbol code to fetch quotes for.'
            },
            maxItems: 10,
            description: 'An array of symbol codes (up to 10) to fetch quotes for.'
          }
        },
        required: ['codes']
      }
    }
  }
};

export { apiTool };