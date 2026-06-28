import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Transport12ApiClient } from "./api.js";
import { registerTools } from "./tools.js";

export function createTransport12McpServer(apiBaseUrl: string): McpServer {
  const server = new McpServer({
    name: "transport12-mcp",
    version: "0.2.0",
  });

  registerTools(
    server,
    new Transport12ApiClient({
      baseUrl: apiBaseUrl,
    }),
  );

  return server;
}
