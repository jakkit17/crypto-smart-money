import { db, httpLogs } from "db";
import type { FastifyInstance } from "fastify";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
]);

function sanitizeHeaders(
  headers: Record<string, string | string[] | undefined>,
) {
  const sanitized: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

export async function registerHttpLogger(
  app: FastifyInstance,
) {
  app.addHook("onResponse", async (request, reply) => {
    try {
      const headers = sanitizeHeaders(request.headers);

      await db.insert(httpLogs).values({
        requestDate: new Date(),

        requester:
          request.headers["x-requester"]?.toString() ?? null,

        remoteAddress:
          request.ip ?? null,

        method: request.method,

        url: request.url,

        body:
          request.body !== undefined
            ? JSON.stringify(request.body)
            : null,

        response: JSON.stringify({
            statusCode: reply.statusCode,
            }),

        header: JSON.stringify(headers),
      });
    } catch (error) {
      request.log.error(
        error,
        "Failed to save HTTP log",
      );
    }
  });
}