# GEMINI.md - Project Context

## Project Overview
`siputzx-mcp-server` is a dynamic Model Context Protocol (MCP) server that exposes the [siputzx.my.id](https://api.siputzx.my.id) API suite to LLMs. It functions as a bridge, allowing AI models to interact with a wide variety of Indonesian-focused services including anime databases, news aggregators, weather information, image generation (textpro, photooxy), and various utility tools.

The server's defining feature is **Runtime Tool Discovery**. It does not have a static list of tools; instead, it fetches and parses the latest OpenAPI specification from the source API at startup and registers all available `GET` and `POST` endpoints as MCP tools automatically.

### Key Technologies
- **Runtime:** Node.js (ESM)
- **SDK:** `@modelcontextprotocol/sdk`
- **Validation:** `zod` (dynamic schema generation from OpenAPI)
- **API Source:** `https://api.siputzx.my.id`

---

## Building and Running

### Prerequisites
- Node.js >= 18.0.0

### Installation
```bash
npm install
```

### Running the Server
The server communicates via standard I/O (stdio), making it compatible with MCP hosts like Claude Desktop.

```bash
# Start locally
npm start

# Run via npx (no install required)
npx siputzx-mcp-server
```

---

## Architecture & Implementation Details

### Tool Registration Workflow
1. **Fetch Spec:** At startup, `src/index.js` fetches the OpenAPI JSON from `https://api.siputzx.my.id/api/openapi.json`.
2. **Parse Paths:** It iterates through all API paths and methods.
3. **Generate Tool Metadata:**
    - **Name:** Derived using the format `method__path_slug` (e.g., `/api/anime/search` via `GET` becomes `get__anime_search`).
    - **Description:** Concatenates summary, description, and technical details (Method, Path, Tags).
    - **Input Schema:** Dynamically constructed `zod` objects based on query parameters (for `GET`) or request body schemas (for `POST`).
4. **Execution Logic:** When a tool is called, the server maps the arguments back to the corresponding API request, executes it, and returns the response.

### Performance & Safety
- **Timeouts:** API requests are capped at 30 seconds.
- **Output Truncation:** Responses are truncated at 60,000 characters to ensure compatibility with LLM context windows.
- **Maintenance Awareness:** Endpoints marked with `x-maintenance: true` in the spec are automatically skipped.

---

## Development Conventions

- **Stateless & Dynamic:** Avoid hardcoding specific API endpoints or tool logic. Any changes to the API should be reflected via the OpenAPI spec and a server restart.
- **Error Handling:** Errors are captured and returned as standard MCP error contents, preventing server crashes during invalid API interactions.
- **Standard I/O:** The server is designed strictly for `StdioServerTransport`. Do not add logging to `stdout` as it will interfere with the MCP protocol; use `process.stderr` for informational logs.
- **Tool Naming:** If modifying the naming logic, ensure it remains predictable and compliant with MCP naming restrictions (alphanumeric and underscores only).
