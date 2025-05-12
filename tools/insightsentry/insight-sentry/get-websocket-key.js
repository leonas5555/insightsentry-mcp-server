/**
 * Obtain your unique WebSocket API key from the /v2/websocket-key endpoint.
 * This key is distinct from any REST API keys you may have.
 *
 * @param {Object} params - Parameters for the request
 * @param {string} params.restApiKey - Your REST API key for authentication
 * @param {string} [params.baseUrl] - Optional base URL for the API (default: https://api.insightsentry.com)
 * @returns {Promise<string>} - Resolves with the WebSocket API key
 */
const getWebSocketKey = async (params = {}) => {
  const { restApiKey, baseUrl = 'https://api.insightsentry.com' } = params;
  if (!restApiKey) {
    throw new Error('restApiKey parameter is required');
  }
  const url = `${baseUrl}/v2/websocket-key`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${restApiKey}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to obtain WebSocket API key: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.websocket_key) {
      throw new Error('websocket_key not found in response');
    }
    return data.websocket_key;
  } catch (error) {
    throw new Error(`Error obtaining WebSocket API key: ${error.message}`);
  }
};

export { getWebSocketKey }; 