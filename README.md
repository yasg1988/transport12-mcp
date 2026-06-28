# transport12-mcp

![transport12 MCP](docs/assets/transport12-mcp.png)

MCP-сервер для HTTP API `transport12`.

Сервер не обращается напрямую к внешним транспортным источникам. Все данные берутся через API основного сервиса `transport12`.

## Варианты подключения

### 1. Локальный MCP

AI-клиент запускает пакет у пользователя на компьютере или на его сервере.

```bash
npx -y transport12-mcp
```

Переменная окружения:

```text
TRANSPORT12_API_BASE_URL=https://your-transport12-api.example
```

### 2. Удаленный MCP

Администратор может поднять `transport12-mcp` как HTTP-сервис:

```bash
MCP_TRANSPORT=http MCP_PORT=3001 MCP_PATH=/mcp MCP_ALLOWED_HOSTS=your-mcp-host.example TRANSPORT12_API_BASE_URL=http://127.0.0.1:3000 transport12-mcp
```

Если задан `MCP_AUTH_TOKEN`, клиент должен передавать:

```text
Authorization: Bearer <token>
```

## Конфигурация клиентов

### Claude Desktop

```json
{
  "mcpServers": {
    "transport12": {
      "command": "npx",
      "args": ["-y", "transport12-mcp"],
      "env": {
        "TRANSPORT12_API_BASE_URL": "https://your-transport12-api.example"
      }
    }
  }
}
```

### Cursor / Windsurf / Cline / Continue

Большинство MCP-клиентов поддерживают тот же формат `mcpServers`:

```json
{
  "mcpServers": {
    "transport12": {
      "command": "npx",
      "args": ["-y", "transport12-mcp"],
      "env": {
        "TRANSPORT12_API_BASE_URL": "https://your-transport12-api.example"
      }
    }
  }
}
```

### Удаленный Streamable HTTP MCP

Если клиент поддерживает remote/HTTP MCP, используйте URL:

```text
https://your-mcp-host.example/mcp
```

Для защищенного endpoint добавьте Bearer token в настройках клиента.

## Разработка

```bash
pnpm install
pnpm run check
pnpm run build
```

Проверить API:

```bash
TRANSPORT12_API_BASE_URL=https://your-transport12-api.example pnpm run smoke
```

Проверить HTTP MCP:

```bash
MCP_HTTP_URL=https://your-mcp-host.example/mcp pnpm run smoke:http
```

## Tools

- `health` - проверить доступность API;
- `get_api_summary` - получить границы и возможности MCP-интеграции;
- `get_service_status` - проверить ключевые endpoint-ы API;
- `search_stops` - найти остановки по названию;
- `find_nearby_stops` - найти ближайшие остановки по координатам;
- `get_stop_routes` - получить маршруты остановки;
- `get_stop_arrivals` - получить фактическое прибытие транспорта на остановку;
- `search_routes` - найти маршруты;
- `get_route` - получить маршрут;
- `get_route_stops` - получить остановки маршрута;
- `get_route_vehicles` - получить транспорт на линии;
- `get_vehicle_forecast` - получить прогноз движения конкретной машины;
- `search_bus_station_destinations` - найти направления автовокзала;
- `get_bus_station_races` - получить рейсы автовокзала на дату;
- `get_bus_station_calendar` - получить наличие рейсов по датам для направления;
- `get_ticket_url` - получить ссылку покупки билета или страницу рейса;
- `search_everything` - единый поиск по остановкам, маршрутам и направлениям автовокзала.

## Не входит в MCP

- избранное, потому что оно привязано к пользователям Telegram/VK и БД;
- выбор языка и локализованные ответы;
- главное меню и бот-сценарии Telegram/VK.
