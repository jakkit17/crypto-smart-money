import type { FastifyInstance } from "fastify";

export async function smartMoneyRoutes(
  app: FastifyInstance,
) {
  app.get("/api/smart-money/candidates", async () => {
    return {
      candidates: [],
    };
  });
}