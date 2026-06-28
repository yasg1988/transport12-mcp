#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Transport12ApiClient } from "./api.js";
import { registerTools } from "./tools.js";

const apiBaseUrl = (process.env.TRANSPORT12_API_BASE_URL || "").replace(/\/+$/, "");

if (!apiBaseUrl) {
  console.error("TRANSPORT12_API_BASE_URL is required");
  process.exit(1);
}

const server = new McpServer({
  name: "transport12-mcp",
  version: "0.1.0",
});

registerTools(
  server,
  new Transport12ApiClient({
    baseUrl: apiBaseUrl,
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
