import Fastify from "fastify";
import cors from "@fastify/cors";

import { registerHttpLogger } from "./plugins/http-logger.js";
import authPlugin from "./plugins/auth.js";

import { smartMoneyRoutes } from "./routes/smart-money.js";
import { usersRoutes } from "./routes/users.js";

import { getWhaleTransactions, upsertUserSmartMoneyRule } from "db";

const app = Fastify({
  logger: true,
});

const start = async () => {
  try {
    await registerHttpLogger(app);

    await app.register(cors, {
      origin: process.env.CORS_ORIGIN?.split(",") ?? [],
      credentials: true,
      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
      ],
    });

    await app.register(authPlugin);

    await smartMoneyRoutes(app);
    await usersRoutes(app);

    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    console.log("🚀 API server started on port 3000");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

app.get("/api/whales", async () => {
  const whales = await getWhaleTransactions(20);

  return {
    data: whales.map((whale) => ({
      ...whale,
      blockNumber: whale.blockNumber.toString(),
    })),
  };
});

app.get(
  "/me",
  {
    preHandler: async (request, reply) => {
      try {
        await app.authenticate(request);
      } catch {
        return reply.code(401).send({
          error: "Unauthorized",
        });
      }
    },
  },
  async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }

    return {
      authenticated: true,
      authUserId: request.user.authUserId,
      userId: request.user.userId,
    };
  },
);

app.put<{
  Body: {
    netFlowWeight?: number;
    largeTransactionsWeight?: number;
    activityWeight?: number;
    positiveFlowWeight?: number;
    netFlowThresholdUsd?: string;
    largeTransactionCount?: number;
    activityCount?: number;
    positiveFlowThresholdUsd?: string;
    enabled?: boolean;
  };
}>(
  "/me/smart-money-rule",
  {
    preHandler: async (request, reply) => {
      try {
        await app.authenticate(request);
      } catch {
        return reply.code(401).send({
          success: false,
          error: "Unauthorized",
        });
      }
    },
  },
  async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: "Unauthorized",
      });
    }

    const rule = await upsertUserSmartMoneyRule({
      userId: request.user.userId,
      ...request.body,
    });

    return {
      success: true,
      smartMoneyRule: rule,
    };
  },
);

start();