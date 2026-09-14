import Fastify from "fastify";
import { enqueueWhaleAlert } from "db";
import type { WhaleEvent } from "shared";
import { startWhaleDigest } from "./whale-digest.js";

const app = Fastify({
  logger: true,
});

startWhaleDigest();

app.post<{ Body: WhaleEvent }>(
  "/internal/whale",
  async (request) => {
    const event = request.body;

    console.log("🐋 Whale event received:");
    console.log(event);

    await enqueueWhaleAlert(event);

    console.log("📥 Whale alert queued");

    return {
      success: true,
    };
  },
);

const port = Number(
  process.env.NOTIFIER_PORT ?? 3001,
);

app.listen({
  port,
  host: "0.0.0.0",
})
  .then(() => {
    console.log(
      `🚀 Notifier server started on port ${port}`,
    );
  })
  .catch((error) => {
    console.error("❌ Notifier server failed:");
    console.error(error);
    process.exit(1);
  });