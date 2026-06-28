#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const apiBaseUrl = (process.env.TRANSPORT12_API_BASE_URL || "").replace(/\/+$/, "");

if (!apiBaseUrl) {
  console.error("TRANSPORT12_API_BASE_URL is required");
  process.exit(1);
}

type QueryValue = string | number | boolean | undefined;

function buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
  const url = new URL(path, `${apiBaseUrl}/`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function apiGet(path: string, query: Record<string, QueryValue> = {}): Promise<unknown> {
  const response = await fetch(buildUrl(path, query), {
    headers: {
      Accept: "application/json",
      "User-Agent": "transport12-mcp/0.1",
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`transport12 API HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: "transport12-mcp",
  version: "0.1.0",
});

server.registerTool(
  "health",
  {
    title: "Health",
    description: "Check transport12 API availability.",
    inputSchema: {},
  },
  async () => jsonContent(await apiGet("/health")),
);

server.registerTool(
  "search_stops",
  {
    title: "Search stops",
    description: "Search transport stops by name.",
    inputSchema: {
      query: z.string().min(1).describe("Stop name or part of a stop name."),
    },
  },
  async ({ query }) => jsonContent(await apiGet("/api/v1/stops/search", { q: query })),
);

server.registerTool(
  "find_nearby_stops",
  {
    title: "Find nearby stops",
    description: "Find nearest stops by latitude and longitude.",
    inputSchema: {
      lat: z.number().describe("Latitude."),
      lng: z.number().describe("Longitude."),
    },
  },
  async ({ lat, lng }) => jsonContent(await apiGet("/api/v1/stops/near", { lat, lng })),
);

server.registerTool(
  "get_stop_routes",
  {
    title: "Get stop routes",
    description: "Get routes serving a stop.",
    inputSchema: {
      stationId: z.number().int().positive().describe("transport12 station id."),
    },
  },
  async ({ stationId }) => jsonContent(await apiGet(`/api/v1/stops/${stationId}/routes`)),
);

server.registerTool(
  "get_stop_arrivals",
  {
    title: "Get stop arrivals",
    description: "Get factual arrival data for a stop.",
    inputSchema: {
      stationId: z.number().int().positive().describe("transport12 station id."),
    },
  },
  async ({ stationId }) => jsonContent(await apiGet(`/api/v1/stops/${stationId}/forecast`)),
);

server.registerTool(
  "search_routes",
  {
    title: "Search routes",
    description: "Search routes by number or name. If query is omitted, returns all routes.",
    inputSchema: {
      query: z.string().optional().describe("Route number or name."),
      kind: z.string().optional().describe("Optional normalized route kind."),
    },
  },
  async ({ query, kind }) => {
    const routes = (await apiGet("/api/v1/routes", { kind })) as unknown[];
    if (!query) return jsonContent(routes);
    const needle = query.toLocaleLowerCase("ru");
    return jsonContent(
      routes.filter((route) => JSON.stringify(route).toLocaleLowerCase("ru").includes(needle)),
    );
  },
);

server.registerTool(
  "get_route",
  {
    title: "Get route",
    description: "Get route details by id.",
    inputSchema: {
      routeId: z.number().int().positive().describe("transport12 route id."),
    },
  },
  async ({ routeId }) => jsonContent(await apiGet(`/api/v1/routes/${routeId}`)),
);

server.registerTool(
  "get_route_stops",
  {
    title: "Get route stops",
    description: "Get route directions and stops.",
    inputSchema: {
      routeId: z.number().int().positive().describe("transport12 route id."),
    },
  },
  async ({ routeId }) => jsonContent(await apiGet(`/api/v1/routes/${routeId}/stops`)),
);

server.registerTool(
  "get_route_vehicles",
  {
    title: "Get route vehicles",
    description: "Get online vehicles for a route.",
    inputSchema: {
      routeId: z.number().int().positive().describe("transport12 route id."),
    },
  },
  async ({ routeId }) => jsonContent(await apiGet("/api/v1/vehicles", { routeId })),
);

server.registerTool(
  "get_vehicle_forecast",
  {
    title: "Get vehicle forecast",
    description: "Get upcoming stops for a vehicle device code.",
    inputSchema: {
      deviceCode: z.string().min(1).describe("Vehicle device code from route vehicles."),
    },
  },
  async ({ deviceCode }) => jsonContent(await apiGet(`/api/v1/vehicles/${encodeURIComponent(deviceCode)}/forecast`)),
);

server.registerTool(
  "search_bus_station_destinations",
  {
    title: "Search bus station destinations",
    description: "Search bus station destinations by settlement name.",
    inputSchema: {
      query: z.string().min(1).describe("Destination name."),
    },
  },
  async ({ query }) => jsonContent(await apiGet("/api/v1/bus-station/destinations/search", { q: query })),
);

server.registerTool(
  "get_bus_station_races",
  {
    title: "Get bus station races",
    description: "Get bus station races for a destination and date.",
    inputSchema: {
      destinationId: z.number().int().positive().describe("Destination id from search_bus_station_destinations."),
      date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).describe("Trip date in dd.mm.yyyy format."),
    },
  },
  async ({ destinationId, date }) =>
    jsonContent(await apiGet("/api/v1/bus-station/races", { destinationId, date })),
);

const transport = new StdioServerTransport();
await server.connect(transport);
