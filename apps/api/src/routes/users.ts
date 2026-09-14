import type { FastifyInstance } from "fastify";

import {
  createUser,
  getUserById,
  getUserSettings,
  upsertUserTrackingConfig,
  upsertUserSmartMoneyRule,
  upsertTelegramNotification,
} from "db";

export async function usersRoutes(
  app: FastifyInstance,
) {
  app.post<{
    Body: {
      email: string;
      name: string;
      timezone?: string;
    };
  }>("/users", async (request, reply) => {
    const {
      email,
      name,
      timezone,
    } = request.body;

    if (!email || !name) {
      return reply.code(400).send({
        success: false,
        error:
          "email and name are required",
      });
    }

    const user = await createUser({
      email,
      name,
      timezone,
    });

    return reply.code(201).send({
      success: true,
      user,
    });
  });

  app.get<{
    Params: {
      id: string;
    };
  }>("/users/:id", async (request, reply) => {
    const user = await getUserById(
      request.params.id,
    );

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: "User not found",
      });
    }

    return {
      success: true,
      user,
    };
  });

  app.put<{
  Params: {
    id: string;
  };
  Body: {
    threshold: string;
    enabled?: boolean;
  };
    }>("/users/:id/tracking", async (request, reply) => {
        const user = await getUserById(request.params.id);

        if (!user) {
            return reply.code(404).send({
            success: false,
            error: "User not found",
            });
        }

        const { threshold, enabled } = request.body;

        if (!threshold) {
            return reply.code(400).send({
            success: false,
            error: "threshold is required",
            });
        }

        const tracking = await upsertUserTrackingConfig({
            userId: request.params.id,
            chain: "ethereum",
            assetType: "native",
            assetSymbol: "ETH",
            threshold,
            enabled,
        });

        return {
            success: true,
            tracking,
        };
    });

    app.get<{
        Params: {
            id: string;
        };
        }>("/users/:id/settings", async (request, reply) => {
        const user = await getUserById(request.params.id);

        if (!user) {
            return reply.code(404).send({
            success: false,
            error: "User not found",
            });
        }

        const settings = await getUserSettings(request.params.id);

        return {
            success: true,
            user,
            settings,
        };
    });

    app.put<{
        Params: {
            id: string;
        };
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
        }>("/users/:id/smart-money-rule", async (request, reply) => {
        const user = await getUserById(request.params.id);

        if (!user) {
            return reply.code(404).send({
            success: false,
            error: "User not found",
            });
        }

        const rule = await upsertUserSmartMoneyRule({
            userId: request.params.id,
            ...request.body,
        });

        return {
            success: true,
            smartMoneyRule: rule,
        };
    });


    app.put<{
        Params: {
            id: string;
        };
        Body: {
            chatId: string;
            enabled?: boolean;
        };
        }>("/users/:id/notification/telegram", async (request, reply) => {
        const user = await getUserById(request.params.id);

        if (!user) {
            return reply.code(404).send({
            success: false,
            error: "User not found",
            });
        }

        const { chatId, enabled } = request.body;

        if (!chatId) {
            return reply.code(400).send({
            success: false,
            error: "chatId is required",
            });
        }

        const notification = await upsertTelegramNotification(
            request.params.id,
            chatId,
            enabled ?? true,
        );

        return {
            success: true,
            notification,
        };
    });
}

