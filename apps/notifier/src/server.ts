import Fastify from "fastify";
import { formatWhaleAlert } from "./format-whale-alert.js";
import { sendTelegramAlert } from "./telegram.js";
import type { WhaleEvent } from "shared";

const app = Fastify({
  logger: true,
});

app.post<{ Body: WhaleEvent }>(
  "/internal/whale",
  async (request) => {
    const event = request.body;

    console.log("🐋 Whale event received:");
    console.log(event);

    const message = formatWhaleAlert(event);

    await sendTelegramAlert(message);

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