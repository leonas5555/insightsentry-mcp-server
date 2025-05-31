import { toolPaths } from "../tools/paths.js";

/**
 * Discovers and loads available tools from the tools directory
 * @returns {Promise<Array>} Array of tool objects
 */
export async function discoverTools() {
  const tools = [];
  
  for (const file of toolPaths) {
    try {
      const module = await import(`../tools/${file}`);
      
      // Handle both single tool exports and multiple tool exports
      if (module.apiTool) {
        // Traditional single tool export
        tools.push({
          ...module.apiTool,
          path: file,
        });
      }
      
      // Handle multiple tool exports from financial-data.js
      if (file.includes('financial-data.js')) {
        const toolExports = [
          'peadEssentialsTool',
          'valuationRatiosTool', 
          'balanceSheetHealthTool',
          'companyInfoTool'
        ];
        
        for (const toolName of toolExports) {
          if (module[toolName]) {
            tools.push({
              ...module[toolName],
              path: file + '/' + toolName,
            });
          }
        }
      }
      
    } catch (error) {
      console.warn(`Failed to load tool from ${file}:`, error.message);
    }
  }
  
  return tools;
}

/**
 * Discovers and loads derived financial tools
 * @returns {Promise<Array>} Array of derived tool objects  
 */
export async function discoverDerivedFinancialTools() {
  try {
    const module = await import('../tools/insightsentry/insight-sentry/financial-derived-tools.js');
    
    const derivedTools = [
      'marketCapScreeningTool',
      'earningsSurpriseTool', 
      'financialHealthFlagsTool',
      'sentimentContextTool'
    ];
    
    const tools = [];
    for (const toolName of derivedTools) {
      if (module[toolName]) {
        tools.push({
          ...module[toolName],
          path: `insightsentry/insight-sentry/financial-derived-tools.js/${toolName}`,
        });
      }
    }
    
    return tools;
  } catch (error) {
    console.warn('Failed to load derived financial tools:', error.message);
    return [];
  }
}

/**
 * Get all tools including base and derived
 * @returns {Promise<Array>} Array of all available tools
 */
export async function getAllTools() {
  const [baseTools, derivedTools] = await Promise.all([
    discoverTools(),
    discoverDerivedFinancialTools()
  ]);
  
  return [...baseTools, ...derivedTools];
}
