import { config } from "dotenv";
import type { WhaleEvent } from "shared";

config({
  path: "../../.env",
});

let lastNotificationAt = 0;

const NOTIFICATION_COOLDOWN_MS = 10_000;

const NOTIFIER_URL =
  process.env.NOTIFIER_URL ??
  "http://localhost:3001";

export async function notifyWhale(
  event: WhaleEvent,
): Promise<void> {

    const now = Date.now();

    if (
    now - lastNotificationAt <
    NOTIFICATION_COOLDOWN_MS
    ) {
    console.log("⏳ Whale alert skipped: cooldown");
    return;
    }

    lastNotificationAt = now;

  const response = await fetch(
    `${NOTIFIER_URL}/internal/whale`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...event,
        blockNumber: event.blockNumber.toString(),
        valueWei: event.valueWei.toString(),
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Notifier error: ${response.status} ${body}`,
    );
  }

  console.log("📨 Whale event sent to notifier");
}