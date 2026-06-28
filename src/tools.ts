import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sanitizeHealth, Transport12ApiClient } from "./api.js";

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

function asArray(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

function matchesQuery(item: unknown, query: string): boolean {
  return JSON.stringify(item).toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"));
}

export function registerTools(server: McpServer, api: Transport12ApiClient): void {
  server.registerTool(
    "health",
    {
      title: "Health",
      description: "Check transport12 API availability. Returns a sanitized health payload.",
      inputSchema: {},
    },
    async () => jsonContent(sanitizeHealth(await api.get("/health"))),
  );

  server.registerTool(
    "get_api_summary",
    {
      title: "Get API summary",
      description: "Return the MCP-facing transport12 API capabilities and endpoint map.",
      inputSchema: {},
    },
    async () =>
      jsonContent({
        service: "transport12",
        boundary: "MCP clients call only the transport12 HTTP API.",
        excluded: ["favorites", "language selection", "localized answer generation", "bot menus"],
        tools: [
          "health",
          "get_service_status",
          "search_stops",
          "find_nearby_stops",
          "get_stop_routes",
          "get_stop_arrivals",
          "search_routes",
          "get_route",
          "get_route_stops",
          "get_route_vehicles",
          "get_vehicle_forecast",
          "search_bus_station_destinations",
          "get_bus_station_races",
          "get_ticket_url",
          "search_everything",
        ],
      }),
  );

  server.registerTool(
    "get_service_status",
    {
      title: "Get service status",
      description: "Run lightweight checks against key transport12 API endpoints.",
      inputSchema: {},
    },
    async () => {
      const checks = await Promise.all([
        api.check("health", "/health"),
        api.check("routes", "/api/v1/routes"),
        api.check("stops_search", "/api/v1/stops/search", { q: "центр" }),
        api.check("bus_station_destinations", "/api/v1/bus-station/destinations/search", { q: "Казань" }),
      ]);
      return jsonContent({
        ok: checks.every((check) => check.ok),
        checkedAt: new Date().toISOString(),
        checks,
      });
    },
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
    async ({ query }) => jsonContent(await api.get("/api/v1/stops/search", { q: query })),
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
    async ({ lat, lng }) => jsonContent(await api.get("/api/v1/stops/near", { lat, lng })),
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
    async ({ stationId }) => jsonContent(await api.get(`/api/v1/stops/${stationId}/routes`)),
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
    async ({ stationId }) => jsonContent(await api.get(`/api/v1/stops/${stationId}/forecast`)),
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
      const routes = asArray(await api.get("/api/v1/routes", { kind }));
      if (!query) return jsonContent(routes);
      return jsonContent(routes.filter((route) => matchesQuery(route, query)));
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
    async ({ routeId }) => jsonContent(await api.get(`/api/v1/routes/${routeId}`)),
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
    async ({ routeId }) => jsonContent(await api.get(`/api/v1/routes/${routeId}/stops`)),
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
    async ({ routeId }) => jsonContent(await api.get("/api/v1/vehicles", { routeId })),
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
    async ({ deviceCode }) => jsonContent(await api.get(`/api/v1/vehicles/${encodeURIComponent(deviceCode)}/forecast`)),
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
    async ({ query }) => jsonContent(await api.get("/api/v1/bus-station/destinations/search", { q: query })),
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
      jsonContent(await api.get("/api/v1/bus-station/races", { destinationId, date })),
  );

  server.registerTool(
    "get_ticket_url",
    {
      title: "Get ticket URL",
      description: "Return a compact ticket purchase URL for a bus station race when available.",
      inputSchema: {
        destinationId: z.number().int().positive().describe("Destination id from search_bus_station_destinations."),
        date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).describe("Trip date in dd.mm.yyyy format."),
        raceId: z.string().optional().describe("Optional race id. If omitted, returns all available race URLs."),
      },
    },
    async ({ destinationId, date, raceId }) => {
      const payload = await api.get("/api/v1/bus-station/races", { destinationId, date });
      const races = asArray((payload as { races?: unknown[] } | null)?.races);
      const selected = raceId
        ? races.filter((race) => (race as { raceId?: unknown }).raceId === raceId)
        : races;
      return jsonContent({
        destinationId,
        date,
        raceId: raceId || null,
        tickets: selected
          .map((race) => {
            const item = race as {
              raceId?: string;
              routeName?: string;
              departureTime?: string;
              arrivalTime?: string;
              buyUrl?: string | null;
              scheduleUrl?: string | null;
            };
            return {
              raceId: item.raceId,
              routeName: item.routeName,
              departureTime: item.departureTime,
              arrivalTime: item.arrivalTime,
              url: item.buyUrl || item.scheduleUrl || null,
              kind: item.buyUrl ? "buy" : item.scheduleUrl ? "schedule" : null,
            };
          })
          .filter((item) => item.url),
      });
    },
  );

  server.registerTool(
    "search_everything",
    {
      title: "Search everything",
      description: "Search stops, routes, and bus station destinations with one query.",
      inputSchema: {
        query: z.string().min(1).describe("Search query."),
        limit: z.number().int().positive().max(20).optional().describe("Maximum items per category."),
      },
    },
    async ({ query, limit = 10 }) => {
      const [stops, routes, destinations] = await Promise.all([
        api.get("/api/v1/stops/search", { q: query }),
        api.get("/api/v1/routes"),
        api.get("/api/v1/bus-station/destinations/search", { q: query }),
      ]);
      return jsonContent({
        query,
        stops: asArray(stops).slice(0, limit),
        routes: asArray(routes).filter((route) => matchesQuery(route, query)).slice(0, limit),
        busStationDestinations: asArray(destinations).slice(0, limit),
      });
    },
  );
}
