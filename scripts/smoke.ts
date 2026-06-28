import { Transport12ApiClient, sanitizeHealth } from "../src/api.js";

const baseUrl = process.env.TRANSPORT12_API_BASE_URL;

if (!baseUrl) {
  console.error("TRANSPORT12_API_BASE_URL is required");
  process.exit(1);
}

const api = new Transport12ApiClient({ baseUrl });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const health = sanitizeHealth(await api.get("/health")) as { ok?: boolean };
  assert(health.ok === true, "health.ok must be true");

  const routes = await api.get("/api/v1/routes");
  assert(Array.isArray(routes), "routes must be an array");

  const stops = await api.get("/api/v1/stops/search", { q: "центр" });
  assert(Array.isArray(stops), "stops search must be an array");

  const destinations = await api.get("/api/v1/bus-station/destinations/search", { q: "Казань" });
  assert(Array.isArray(destinations), "bus station destination search must be an array");

  const calendar = await api.get("/api/v1/bus-station/calendar", { destinationId: 85833, days: 1 }) as { days?: unknown[] };
  assert(Array.isArray(calendar.days), "bus station calendar days must be an array");

  const checks = await Promise.all([
    api.check("health", "/health"),
    api.check("routes", "/api/v1/routes"),
    api.check("stops_search", "/api/v1/stops/search", { q: "центр" }),
    api.check("bus_station_destinations", "/api/v1/bus-station/destinations/search", { q: "Казань" }),
    api.check("bus_station_calendar", "/api/v1/bus-station/calendar", { destinationId: 85833, days: 1 }),
  ]);
  assert(checks.every((check) => check.ok), `service checks failed: ${JSON.stringify(checks)}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        routes: routes.length,
        stops: stops.length,
        destinations: destinations.length,
        calendarDays: calendar.days.length,
        checks,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
