#!/usr/bin/env node
import dotenv from "dotenv";
import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// Import the tool functions
import { apiTool as newsFeedTool } from "./tools/insightsentry/insight-sentry/news-feed-live-streaming.js";
import { apiTool as realTimeDataTool } from "./tools/insightsentry/insight-sentry/real-time-data-streaming.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT = process.env.STREAMING_PORT || 3002;

const server = http.createServer((req, res) => {
  // Basic HTTP server, can be expanded if needed for health checks etc.
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

console.log(`[Streaming Server] WebSocket server started on port ${PORT}`);

wss.on("connection", (ws, req) => {
  const requestUrl = new URL(req.url, `ws://${req.headers.host}`);
  const toolName = requestUrl.pathname.substring(1); // Remove leading '/'
  
  // Parse query parameters
  const queryParams = {};
  for (const [key, value] of requestUrl.searchParams) {
    // Basic parsing for parameters
    if (key === 'symbols' || key === 'keywords') {
      // Handle array parameters
      try {
        queryParams[key] = JSON.parse(value);
      } catch (e) {
        // If not valid JSON, treat as a single-item array
        queryParams[key] = [value];
      }
    } else {
      queryParams[key] = value;
    }
  }

  console.log(`[Streaming Server] Client connected for tool: ${toolName} with params:`, queryParams);

  let toolModule;

  if (toolName === newsFeedTool.definition.function.name) {
    toolModule = newsFeedTool;
  } else if (toolName === realTimeDataTool.definition.function.name) {
    toolModule = realTimeDataTool;
  } else {
    console.log(`[Streaming Server] Unknown tool: ${toolName}. Closing connection.`);
    ws.send(JSON.stringify({ error: `Unknown tool: ${toolName}` }));
    ws.close(1008, "Unknown tool");
    return;
  }

  // Execute the tool function with parameters
  toolModule.function(queryParams)
    .then(clientSocket => {
      if (clientSocket && clientSocket instanceof WebSocket) {
        console.log(`[Streaming Server] Piping messages for tool: ${toolName}`);

        // Forward messages from the target WebSocket to the client
        clientSocket.onmessage = (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };
        clientSocket.onerror = (error) => {
          console.error(`[Streaming Server] Error from target WebSocket for ${toolName}:`, error);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ error: `Target WebSocket error for ${toolName}` }));
          }
        };
        clientSocket.onclose = () => {
          console.log(`[Streaming Server] Target WebSocket for ${toolName} closed.`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, `Target WebSocket for ${toolName} closed.`);
          }
        };

        // Forward messages from the client to the target WebSocket
        ws.onmessage = (message) => {
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(message);
          }
        };

        // Handle client closing the connection
        ws.onclose = () => {
          console.log(`[Streaming Server] Client disconnected from ${toolName}.`);
          if (clientSocket.readyState === WebSocket.OPEN || clientSocket.readyState === WebSocket.CONNECTING) {
            clientSocket.close();
          }
        };
      } else {
        console.log(`[Streaming Server] Tool ${toolName} executed but did not return a manageable WebSocket. This path should ideally not be hit if tools are updated.`);
        ws.send(JSON.stringify({ message: `Connected to ${toolName}. It should handle its own streaming or was expected to return a WebSocket.`}));
      }
    })
    .catch(error => {
      console.error(`[Streaming Server] Error executing tool ${toolName} with params ${JSON.stringify(queryParams)}:`, error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: `Error executing tool ${toolName}: ${error.message}` }));
        ws.close(1011, `Error executing tool ${toolName}`);
      }
    });

  ws.on("error", (error) => {
    console.error(`[Streaming Server] WebSocket error for client connected to ${toolName}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`[Streaming Server] HTTP server listening on port ${PORT}, WebSocket server is attached.`);
});

process.on("SIGINT", () => {
  console.log("[Streaming Server] Shutting down...");
  wss.close(() => {
    server.close(() => {
      console.log("[Streaming Server] Shutdown complete.");
      process.exit(0);
    });
  });
}); 