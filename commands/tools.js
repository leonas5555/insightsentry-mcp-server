import { getAllTools } from "../lib/tools.js";

export function registerToolsCommand(program) {
  program
    .command("tools")
    .description("List all available API tools including derived strategy-specific tools")
    .action(async () => {
      const tools = await getAllTools();
      if (tools.length === 0) {
        console.log("No tools found. Tools should be organized as:");
        console.log("tools/workspace/collection/request.js\n");
        return;
      }

      console.log("\nAvailable Tools:\n");

      // Group tools by workspace/collection
      const groupedTools = tools.reduce((acc, tool) => {
        // Extract workspace and collection from path
        const parts = tool.path.split("/");
        const workspace = parts[1] || "Unknown Workspace";
        const collection = parts[2] || "Unknown Collection";

        if (!acc[workspace]) acc[workspace] = {};
        if (!acc[workspace][collection]) acc[workspace][collection] = [];

        acc[workspace][collection].push(tool);
        return acc;
      }, {});

      // Print tools in a hierarchical structure
      for (const [workspace, collections] of Object.entries(groupedTools)) {
        console.log(`📁 Workspace: ${workspace}`);
        for (const [collection, tools] of Object.entries(collections)) {
          console.log(`  📂 Collection: ${collection}`);
          tools.forEach(
            ({
              definition: {
                function: { name, description, parameters },
              },
              path
            }) => {
              // Mark derived tools with special indicator
              const isDerived = path.includes('derived-tools') || path.includes('Tool');
              const indicator = isDerived ? '🔧' : '⚙️';
              
              console.log(`    ${indicator} ${name}`);
              console.log(
                `      Description: ${description || "No description provided"}`
              );
              if (parameters?.properties) {
                console.log("      Parameters:");
                Object.entries(parameters.properties).forEach(
                  ([name, details]) => {
                    console.log(
                      `        - ${name}: ${
                        details.description || "No description"
                      }`
                    );
                  }
                );
              }
              if (isDerived) {
                console.log(`      Type: Strategy-optimized tool`);
              }
              console.log("");
            }
          );
        }
        console.log("");
      }
      
      // Print summary
      const derivedCount = tools.filter(t => t.path.includes('derived-tools') || t.path.includes('Tool')).length;
      const baseCount = tools.length - derivedCount;
      
      console.log(`📊 Summary:`);
      console.log(`   ⚙️  Base tools: ${baseCount}`);
      console.log(`   🔧 Strategy-optimized tools: ${derivedCount}`);
      console.log(`   📦 Total tools: ${tools.length}`);
    });
}