# Postman Agent Generator

Welcome to your generated agent! 🚀

This project was created with the [Postman Agent Generator](https://postman.com/explore/agent-generator), configured to [Model Context Provider (MCP)](https://modelcontextprotocol.io/introduction) Server output mode. It provides you with:

- ✅ An MCP-compatible server (`mcpServer.js`)
- ✅ Automatically generated JavaScript tools for each selected Postman API request

Let's set things up!

## 🚦 Getting Started

### ⚙️ Prerequisites

Before starting, please ensure you have:

- [Node.js (v16+ required, v20+ recommended)](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (included with Node)

### 📥 Installation & Setup

**1. Install dependencies**

Run from your project's root directory:

```sh
npm install
```

### 🔐 Set tool environment variables

In the `.env` file, you'll see environment variable placeholders, one for each workspace that the selected tools are from. For example, if you selected requests from 2 workspaces, e.g. Acme and Widgets, you'll see two placeholders:

```
ACME_API_KEY=
WIDGETS_API_KEY=
```

Update the values with actual API keys for each API. These environment variables are used inside of the generated tools to set the API key for each request. You can inspect a file in the `tools` directory to see how it works.

```javascript
// environment variables are used inside of each tool file
const apiKey = process.env.ACME_API_KEY;
```

**Caveat:** This may not be correct for every API. The generation logic is relatively simple - for each workspace, we create an environment variable with the same name as the workspace slug, and then use that environment variable in each tool file that belongs to that workspace. If this isn't the right behavior for your chosen API, no problem! You can manually update anything in the `.env` file or tool files to accurately reflect the API's method of authentication.

In the `.env` file, add the following environment variables for InsightSentry tools:

```
INSIGHTSENTRY_API_KEY=your_api_key_here
INSIGHTSENTRY_BASE_URL=https://insightsentry.p.rapidapi.com
INSIGHTSENTRY_WS_URL=wss://stream.insightsentry.com/quote
```

The `INSIGHTSENTRY_API_KEY` is your RapidAPI key for accessing the InsightSentry API.
The `INSIGHTSENTRY_BASE_URL` is the base URL for REST API endpoints.
The `INSIGHTSENTRY_WS_URL` is the WebSocket URL for real-time data streams.

### 🛠️ List Available Tools

List descriptions and parameters from all generated tools with:

```sh
node index.js tools
```

Example:

```
Available Tools:

Workspace: acme-workspace
  Collection: useful-api
    list_all_customers
      Description: Retrieve a list of useful things.
      Parameters:
        - magic: The required magic power
        - limit: Number of results returned
        [...additional parameters...]
```

## 🌐 Running the MCP Server

The MCP Server (`mcpServer.js`) exposes your automated API tools to MCP-compatible clients, such as Claude Desktop or the Postman Desktop Application.

### A) 🖥️ Run with Postman

The Postman Desktop Application is the easiest way to run and test MCP servers.

Step 1: Download the latest Postman Desktop Application from [https://www.postman.com/downloads/](https://www.postman.com/downloads/).

Step 2: Read out the documentation article [here](https://learning.postman.com/docs/postman-ai-agent-builder/mcp-requests/overview/) for the next steps.

### B) 👩‍💻 Run with Claude Desktop

To integrate with Claude Desktop:

1. Find node path:

```sh
which node
```

2. Find `mcpServer.js` path:

```sh
realpath mcpServer.js
```

3. Open Claude Desktop → **Settings** → **Developers** → **Edit Config** and add your server:

```json
{
  "mcpServers": {
    "<server_name>": {
      "command": "<absolute_path_to_node>",
      "args": ["<absolute_path_to_mcpServer.js>"]
    }
  }
}
```

Restart Claude Desktop to activate this change.

### Additional Options

#### 🐳 Docker Deployment (Production)

For production deployments, you can use Docker:

**1. Build Docker image**

```sh
docker build -t <your_server_name> .
```

**2. Claude Desktop Integration**

Add Docker server configuration to Claude Desktop (Settings → Developers → Edit Config):

```json
{
  "mcpServers": {
    "<your_server_name>": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--env-file=.env", "<your_server_name>"]
    }
  }
}
```

> Add your environment variables (API keys, etc.) inside the `.env` file.

#### 🌐 Server-Sent Events (SSE)

To run the server with Server-Sent Events (SSE) support, use the `--sse` flag:

```sh
node mcpServer.js --sse
```

## 🐳 Dockerfile (Included)

The project comes bundled with the following minimal Docker setup:

```dockerfile
FROM node:22.12-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENTRYPOINT ["node", "mcpServer.js"]
```

## ➕ Adding New Tools

Extend your agent with more tools easily:

1. Visit [Postman Agent Generator](https://postman.com/explore/agent-generator).
2. Pick new API request(s), generate a new agent, and download it.
3. Copy new generated tool(s) into your existing project's `tools/` folder.
4. Update your `tools/paths.js` file to include new tool references.

## 💬 Questions & Support

Visit the [Postman Agent Generator](https://postman.com/explore/agent-generator) page for updates and new capabilities.

Visit the [Postman Community](https://community.postman.com/) to share what you've built, ask questions and get help.
