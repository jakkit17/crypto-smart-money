import { config } from "dotenv";
import Fastify from "fastify";

import { skipToLatestBlock } from "./skip-to-latest.js";

config({
  path: "../../.env",
});

const app = Fastify({
  logger: true,
});

app.post(
  "/internal/indexer/skip-to-latest",
  async () => {
    const result = await skipToLatestBlock();

    return {
      success: true,
      latestBlock: result.latestBlock.toString(),
    };
  },
);

const port = Number(
  process.env.INDEXER_PORT ?? "3002",
);

app.listen({
  port,
  host: "0.0.0.0",
}).then(() => {
  console.log(
    `🚀 Indexer API listening on port ${port}`,
  );
}).catch((error) => {
  console.error(
    "❌ Failed to start Indexer API:",
  );
  console.error(error);
  process.exit(1);
});