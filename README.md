# transport12-mcp

![transport12 MCP](docs/assets/transport12-mcp.png)

[![npm version](https://img.shields.io/npm/v/transport12-mcp.svg)](https://www.npmjs.com/package/transport12-mcp)
[![npm downloads](https://img.shields.io/npm/dm/transport12-mcp.svg)](https://www.npmjs.com/package/transport12-mcp)
[![license](https://img.shields.io/npm/l/transport12-mcp.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-339933.svg)](package.json)
[![MCP](https://img.shields.io/badge/MCP-stdio%20%2B%20Streamable%20HTTP-5A67D8.svg)](https://modelcontextprotocol.io/)

MCP-сервер для HTTP API `transport12`.

Сервер не обращается напрямую к внешним транспортным источникам. Все данные берутся через API основного сервиса `transport12`.

## Меню

- [Быстрый старт](#быстрый-старт)
- [Варианты подключения](#варианты-подключения)
- [Переменные окружения](#переменные-окружения)
- [Подключение к AI-клиентам и агентам](#подключение-к-ai-клиентам-и-агентам)
- [Подключение через платформы и LLM-провайдеры](#подключение-через-платформы-и-llm-провайдеры)
- [Разработка](#разработка)
- [Tools](#tools)

## Быстрый старт

Локальный запуск через npm:

```bash
TRANSPORT12_API_BASE_URL=https://your-transport12-api.example npx -y transport12-mcp
```

Готовый удаленный MCP endpoint:

```text
https://transport12.yasg.ru/mcp
```

Если AI-клиент поддерживает удаленный MCP, достаточно указать этот URL как Streamable HTTP MCP server.

## Варианты подключения

### 1. Локальный MCP

AI-клиент запускает пакет у пользователя на компьютере или на его сервере.

```bash
npx -y transport12-mcp
```

Минимальная переменная окружения:

```text
TRANSPORT12_API_BASE_URL=https://your-transport12-api.example
```

### 2. Удаленный MCP

Можно использовать готовый endpoint:

```text
https://transport12.yasg.ru/mcp
```

Или поднять свой HTTP-сервис:

```bash
MCP_TRANSPORT=http MCP_PORT=3001 MCP_PATH=/mcp MCP_ALLOWED_HOSTS=your-mcp-host.example TRANSPORT12_API_BASE_URL=http://127.0.0.1:3000 transport12-mcp
```

Если задан `MCP_AUTH_TOKEN`, клиент должен передавать:

```text
Authorization: Bearer <token>
```

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `TRANSPORT12_API_BASE_URL` | да | нет | Базовый URL API `transport12` |
| `MCP_TRANSPORT` | нет | `stdio` | `stdio` или `http` |
| `MCP_HOST` | нет | `127.0.0.1` | Host для HTTP MCP |
| `MCP_PORT` | нет | `3001` | Port для HTTP MCP |
| `MCP_PATH` | нет | `/mcp` | Path для Streamable HTTP MCP |
| `MCP_ALLOWED_HOSTS` | нет | нет | Разрешенные внешние host-ы за reverse proxy |
| `MCP_AUTH_TOKEN` | нет | нет | Bearer token для защищенного HTTP MCP |

## Подключение к AI-клиентам и агентам

### Claude Desktop

Стабильный вариант для Claude Desktop - локальный stdio MCP:

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

Если ваша версия Claude Desktop или рабочее пространство поддерживает удаленные MCP/connectors через интерфейс приложения, используйте URL:

```text
https://transport12.yasg.ru/mcp
```

Если прямое подключение HTTP MCP в Claude Desktop недоступно, используйте локальный `npx`-вариант выше или Claude Code CLI.

### Claude Code CLI

Удаленный MCP:

```bash
claude mcp add --transport http transport12 https://transport12.yasg.ru/mcp
```

Локальный MCP:

```bash
claude mcp add transport12 -- npx -y transport12-mcp
```

Для локального варианта добавьте `TRANSPORT12_API_BASE_URL` в окружение терминала или в JSON-конфигурацию Claude Code.

### OpenAI Codex CLI

Локальный MCP в `~/.codex/config.toml`:

```toml
[mcp_servers.transport12]
command = "npx"
args = ["-y", "transport12-mcp"]
env = { TRANSPORT12_API_BASE_URL = "https://your-transport12-api.example" }
```

Локальный MCP через CLI:

```bash
codex mcp add transport12 --env TRANSPORT12_API_BASE_URL=https://your-transport12-api.example -- npx -y transport12-mcp
```

Удаленный MCP в `~/.codex/config.toml`:

```toml
[mcp_servers.transport12]
url = "https://transport12.yasg.ru/mcp"
```

### Gemini CLI

Gemini CLI использует `mcpServers` в `~/.gemini/settings.json` или `.gemini/settings.json`.

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

### Qwen Code

Qwen Code поддерживает MCP и может настраиваться через `qwen mcp` или `settings.json`.

Удаленный MCP:

```bash
qwen mcp add --transport http transport12 https://transport12.yasg.ru/mcp
```

Локальный MCP:

```bash
qwen mcp add transport12 -- npx -y transport12-mcp
```

JSON-вариант:

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

### Cursor, Windsurf, Cline, Roo Code, Kilo Code, Continue

Большинство IDE-агентов и расширений используют формат `mcpServers`.

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

Если клиент поддерживает remote MCP:

```json
{
  "mcpServers": {
    "transport12": {
      "url": "https://transport12.yasg.ru/mcp"
    }
  }
}
```

### VS Code, GitHub Copilot, Gemini Code Assist

Для клиентов VS Code, которые используют ключ `servers`, конфигурация обычно выглядит так:

```json
{
  "servers": {
    "transport12": {
      "url": "https://transport12.yasg.ru/mcp"
    }
  }
}
```

Для расширений, которые используют `mcpServers`, применяйте общий JSON из раздела выше.

### Zed

Для Zed используйте локальный stdio-вариант через `npx` или remote URL, если ваша версия клиента поддерживает HTTP MCP:

```json
{
  "context_servers": {
    "transport12": {
      "command": {
        "path": "npx",
        "args": ["-y", "transport12-mcp"],
        "env": {
          "TRANSPORT12_API_BASE_URL": "https://your-transport12-api.example"
        }
      }
    }
  }
}
```

### Cherry Studio, ChatWise, Trae AI, Tongyi Lingma

Для клиентов с китайской экосистемой используйте один из двух вариантов:

Локальный stdio:

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

Удаленный Streamable HTTP:

```json
{
  "mcpServers": {
    "transport12": {
      "url": "https://transport12.yasg.ru/mcp"
    }
  }
}
```

Названия полей в конкретном клиенте могут отличаться: `url`, `serverUrl`, `type`, `transport`, `headers`. Если есть выбор транспорта, указывайте `streamable-http` или `http`.

### Универсальный Streamable HTTP MCP

Для любого клиента с поддержкой remote MCP:

```text
https://transport12.yasg.ru/mcp
```

Для защищенного endpoint добавьте Bearer token в настройках клиента:

```text
Authorization: Bearer <token>
```

## Подключение через платформы и LLM-провайдеры

### YandexGPT / Yandex Cloud AI Studio

В Yandex Cloud AI Studio используйте MCP Hub и подключайте `transport12` как внешний MCP-сервер. В настройках транспорта выбирайте HTTP/Streamable HTTP, если такой выбор доступен:

```text
https://transport12.yasg.ru/mcp
```

Если нужен изолированный контур, разверните `transport12-mcp` в своей инфраструктуре и укажите внутренний URL.

### GigaChat

Для GigaChat подключение обычно делается не в самом пользовательском чате, а через MCP-совместимый агентный слой: LangChain/LangGraph, LlamaIndex, Dify, Flowise, CrewAI, AutoGen, VoltAgent или собственный backend.

Рекомендуемый вариант:

```text
GigaChat -> агент/оркестратор с MCP client -> https://transport12.yasg.ru/mcp
```

### LangChain, LlamaIndex, Dify, Flowise, n8n, CrewAI, AutoGen, VoltAgent, Pipecat

Используйте transport12 как внешний MCP server. Для платформ с поддержкой HTTP MCP указывайте:

```text
https://transport12.yasg.ru/mcp
```

Для платформ, которые умеют только stdio, запускайте пакет локально:

```bash
TRANSPORT12_API_BASE_URL=https://your-transport12-api.example npx -y transport12-mcp
```

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
MCP_HTTP_URL=https://transport12.yasg.ru/mcp pnpm run smoke:http
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
