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
  }>(
    "/users",
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

      const {
        email,
        name,
        timezone,
      } = request.body;

      if (!email || !name) {
        return reply.code(400).send({
          success: false,
          error: "email and name are required",
        });
      }

      const user = await createUser({
        email,
        name,
        timezone,
        authUserId: request.user.authUserId,
      });

      return reply.code(201).send({
        success: true,
        user,
      });
    },
  );

  app.get<{
    Params: {
      id: string;
    };
  }>(
    "/users/:id",
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

      if (request.params.id !== request.user.userId) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
        });
      }

      const user = await getUserById(
        request.user.userId,
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
    },
  );

  app.put<{
    Params: {
      id: string;
    };
    Body: {
      threshold: string;
      enabled?: boolean;
    };
  }>(
    "/users/:id/tracking",
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

      if (request.params.id !== request.user.userId) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
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
        userId: request.user.userId,
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
    },
  );

  app.get<{
    Params: {
      id: string;
    };
  }>(
    "/users/:id/settings",
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

      if (request.params.id !== request.user.userId) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
        });
      }

      const user = await getUserById(
        request.user.userId,
      );

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      const settings = await getUserSettings(
        request.user.userId,
      );

      return {
        success: true,
        user,
        settings,
      };
    },
  );

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
  }>(
    "/users/:id/smart-money-rule",
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

      if (request.params.id !== request.user.userId) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
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

  app.put<{
    Params: {
      id: string;
    };
    Body: {
      chatId: string;
      enabled?: boolean;
    };
  }>(
    "/users/:id/notification/telegram",
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

      if (request.params.id !== request.user.userId) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
        });
      }

      const {
        chatId,
        enabled,
      } = request.body;

      if (!chatId) {
        return reply.code(400).send({
          success: false,
          error: "chatId is required",
        });
      }

      const notification =
        await upsertTelegramNotification(
          request.user.userId,
          chatId,
          enabled ?? true,
        );

      return {
        success: true,
        notification,
      };
    },
  );


  app.get(
    "/me/settings",
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

        const user = await getUserById(request.user.userId);

        if (!user) {
        return reply.code(404).send({
            success: false,
            error: "User not found",
        });
        }

        const settings = await getUserSettings(
        request.user.userId,
        );

        return {
        success: true,
        user,
        settings,
        };
    },
    );

    app.put<{
    Body: {
        threshold: string;
        enabled?: boolean;
    };
    }>(
    "/me/tracking",
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

        const {
        threshold,
        enabled,
        } = request.body;

        if (!threshold) {
        return reply.code(400).send({
            success: false,
            error: "threshold is required",
        });
        }

        const tracking =
        await upsertUserTrackingConfig({
            userId: request.user.userId,
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
    },
    );


}