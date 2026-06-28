#!/usr/bin/env node
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createTransport12McpServer } from "./server.js";

const DEFAULT_MCP_PATH = "/mcp";

function requiredApiBaseUrl(): string {
  const apiBaseUrl = (process.env.TRANSPORT12_API_BASE_URL || "").replace(/\/+$/, "");
  if (!apiBaseUrl) {
    console.error("TRANSPORT12_API_BASE_URL is required");
    process.exit(1);
  }
  return apiBaseUrl;
}

async function runStdio() {
  const server = createTransport12McpServer(requiredApiBaseUrl());
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function runHttp() {
  const apiBaseUrl = requiredApiBaseUrl();
  const host = process.env.MCP_HOST || "127.0.0.1";
  const port = Number(process.env.MCP_PORT || 3001);
  const path = process.env.MCP_PATH || DEFAULT_MCP_PATH;
  const authToken = process.env.MCP_AUTH_TOKEN;
  const allowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(",").map((item) => item.trim()).filter(Boolean);
  const app = createMcpExpressApp({ host, allowedHosts });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "transport12-mcp", transport: "http", path });
  });

  app.use(path, async (req, res, next) => {
    if (authToken) {
      const header = req.header("authorization") || "";
      if (header !== `Bearer ${authToken}`) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }
    next();
  });

  app.post(path, async (req, res) => {
    const server = createTransport12McpServer(apiBaseUrl);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get(path, (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  app.delete(path, (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  app.listen(port, host, (error?: Error) => {
    if (error) {
      console.error("Failed to start transport12 MCP HTTP server:", error);
      process.exit(1);
    }
    console.error(`transport12 MCP HTTP server listening on ${host}:${port}${path}`);
  });
}

const useHttp = process.argv.includes("--http") || process.env.MCP_TRANSPORT === "http";

if (useHttp) {
  await runHttp();
} else {
  await runStdio();
}
