import type { FastifyInstance } from "fastify";
import { getSmartMoneyCandidates } from "db";

const DEFAULT_SCORE_THRESHOLD = 30;
const DEFAULT_LIMIT = 20;
const MAX_SCORE_THRESHOLD = 100;
const MAX_LIMIT = 100;
const WHALE_THRESHOLD_USD = 10_000;

type SmartMoneyQuery = {
  scoreThreshold?: string;
  limit?: string;
};

export async function smartMoneyRoutes(
  app: FastifyInstance,
) {
  app.get<{ Querystring: SmartMoneyQuery }>(
    "/api/smart-money/candidates",
    async (request, reply) => {
      const scoreThreshold = Number(
        request.query.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD,
        );

      const limit = Number(
        request.query.limit ?? DEFAULT_LIMIT,
        );

      if (
            !Number.isInteger(scoreThreshold) ||
            scoreThreshold < 0 ||
            scoreThreshold > MAX_SCORE_THRESHOLD
        ) {
            return reply.code(400).send({
                error: `scoreThreshold must be an integer between 0 and ${MAX_SCORE_THRESHOLD}`,
            });
        }

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > MAX_LIMIT
        ) {
            return reply.code(400).send({
                error: `limit must be an integer between 1 and ${MAX_LIMIT}`,
            });
        }

        const candidates =
            await getSmartMoneyCandidates(
                WHALE_THRESHOLD_USD,
                scoreThreshold,
            );

      const data = candidates.slice(0, limit);

      return {
        data,
        meta: {
          count: data.length,
          limit,
          scoreThreshold,
        },
      };
    },
  );
}