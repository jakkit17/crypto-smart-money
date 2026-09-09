import type { FastifyInstance } from "fastify";
import { getSmartMoneyCandidates } from "db";

export async function smartMoneyRoutes(
  app: FastifyInstance,
) {
  app.get("/api/smart-money/candidates", async () => {
    const candidates =
      await getSmartMoneyCandidates();

    return {
      data: candidates,
    };
  });
}