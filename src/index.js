#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import https from "node:https";
import http from "node:http";

const BASE_URL = "https://api.siputzx.my.id";
const OPENAPI_URL = `${BASE_URL}/api/openapi.json`;
const TIMEOUT_MS = 30_000;
const TRUNCATE_CHARS = 60_000;

function fetchRaw(urlStr, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const headers = { "User-Agent": "siputzx-mcp-server/1.0" };
    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => resolve(raw));
      }
    );

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error(`Timeout: ${urlStr}`));
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function fetchJson(urlStr) {
  const raw = await fetchRaw(urlStr);
  return JSON.parse(raw);
}

async function apiCall(method, apiPath, args) {
  const clean = Object.fromEntries(
    Object.entries(args ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
    )
  );

  if (method === "GET") {
    const qs =
      Object.keys(clean).length > 0
        ? "?" + new URLSearchParams(clean).toString()
        : "";
    const raw = await fetchRaw(`${BASE_URL}${apiPath}${qs}`);
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  const body = JSON.stringify(clean);
  const raw = await fetchRaw(`${BASE_URL}${apiPath}`, "POST", body);
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toToolName(apiPath, method) {
  return (
    method.toLowerCase() +
    "__" +
    apiPath
      .replace(/^\/api\//, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase()
  );
}

function extractParams(method, info) {
  const params = [];

  if (method === "get") {
    for (const p of info.parameters ?? []) {
      if (p.in !== "query") continue;
      params.push({
        name: p.name,
        type: p.schema?.type ?? "string",
        required: p.required ?? false,
        description: p.description ?? p.name,
        example: p.example,
        enumValues: p.schema?.enum,
      });
    }
  }

  if (method === "post") {
    const ct = info.requestBody?.content ?? {};
    const schema =
      ct["application/json"]?.schema ??
      ct["application/x-www-form-urlencoded"]?.schema ??
      ct["multipart/form-data"]?.schema;

    if (schema?.properties) {
      const required = new Set(schema.required ?? []);
      for (const [name, prop] of Object.entries(schema.properties)) {
        params.push({
          name,
          type: prop.type ?? "string",
          required: required.has(name),
          description: prop.description ?? name,
          example: prop.example,
          enumValues: prop.enum,
        });
      }
    }
  }

  return params;
}

function buildZodShape(params) {
  const shape = {};
  for (const p of params) {
    let field =
      p.enumValues?.length
        ? z.enum(p.enumValues)
        : p.type === "integer" || p.type === "number"
        ? z.coerce.number()
        : p.type === "boolean"
        ? z.coerce.boolean()
        : z.string();

    if (!p.required) field = field.optional();

    const desc =
      p.example !== undefined
        ? `${p.description} (contoh: ${JSON.stringify(p.example)})`
        : p.description;

    shape[p.name] = field.describe(desc);
  }
  return shape;
}

function truncate(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return text.length > TRUNCATE_CHARS
    ? text.slice(0, TRUNCATE_CHARS) + "\n...[truncated]"
    : text;
}

async function main() {
  process.stderr.write("Fetching OpenAPI spec dari siputzx.my.id...\n");

  let spec;
  try {
    spec = await fetchJson(OPENAPI_URL);
  } catch (err) {
    process.stderr.write(`Gagal fetch OpenAPI spec: ${err.message}\n`);
    process.exit(1);
  }

  const paths = spec?.paths ?? {};
  const server = new McpServer({ name: "siputzx-mcp-server", version: "1.0.0" });
  let count = 0;

  for (const [apiPath, methods] of Object.entries(paths)) {
    for (const [method, info] of Object.entries(methods)) {
      if (method !== "get" && method !== "post") continue;
      if (info["x-maintenance"] === true) continue;

      const toolName = toToolName(apiPath, method);
      const params = extractParams(method, info);
      const zodShape = buildZodShape(params);

      const description = [
        (info.description ?? info.summary ?? apiPath).slice(0, 300),
        `Method: ${method.toUpperCase()} ${apiPath}`,
        info.tags?.length ? `Tags: ${info.tags.join(", ")}` : null,
        info["x-premium"] ? "Premium endpoint." : null,
      ]
        .filter(Boolean)
        .join("\n");

      const capturedPath = apiPath;
      const capturedMethod = method.toUpperCase();

      server.registerTool(
        toolName,
        {
          title: info.summary ?? apiPath,
          description,
          inputSchema: z.object(zodShape).strict(),
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
          },
        },
        async (args) => {
          try {
            const data = await apiCall(capturedMethod, capturedPath, args);
            return { content: [{ type: "text", text: truncate(data) }] };
          } catch (err) {
            return {
              content: [{ type: "text", text: `Error: ${err.message}` }],
              isError: true,
            };
          }
        }
      );

      count++;
    }
  }

  process.stderr.write(
    `${count} tools registered dari ${Object.keys(paths).length} paths.\n`
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("siputzx-mcp-server siap.\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
