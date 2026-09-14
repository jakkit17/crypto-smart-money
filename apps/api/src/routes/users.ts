import type { FastifyInstance } from "fastify";

import {
  createUser,
  getUserById,
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
}