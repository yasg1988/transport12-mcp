import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.env.MCP_HTTP_URL;

if (!url) {
  console.error("MCP_HTTP_URL is required");
  process.exit(1);
}

const token = process.env.MCP_AUTH_TOKEN;
const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : undefined,
});

const client = new Client({
  name: "transport12-mcp-smoke",
  version: "0.1.0",
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const health = await client.callTool({ name: "health", arguments: {} });
  console.log(
    JSON.stringify(
      {
        ok: true,
        toolCount: tools.tools.length,
        hasCalendar: tools.tools.some((tool) => tool.name === "get_bus_station_calendar"),
        health,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
