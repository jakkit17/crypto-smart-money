
import { config } from "dotenv";

config({
  path: "../../.env",
});

import {
  getPendingUserWhaleAlerts,
  markUserWhaleAlertSent,
} from "db";

import { sendTelegramAlert } from "./telegram.js";

const DIGEST_INTERVAL_MINUTES = Number(
  process.env.WHALE_DIGEST_INTERVAL_MINUTES ?? "5",
);

const DIGEST_INTERVAL_MS =
  DIGEST_INTERVAL_MINUTES * 60 * 1000;

const MAX_MESSAGE_LENGTH = Number(
  process.env.TELEGRAM_MAX_MESSAGE_LENGTH ?? "3500",
);

let isRunning = false;

type UserWhaleAlert = Awaited<
  ReturnType<typeof getPendingUserWhaleAlerts>
>[number];

function formatDigest(
  alerts: UserWhaleAlert[],
  part: number,
  totalParts: number,
): string {
  const totalEth = alerts.reduce(
    (sum, alert) => sum + Number(alert.valueEth),
    0,
  );

  const lines = [
    `🐋 WHALE ALERT — DIGEST ${part}/${totalParts}`,
    "",
    `📊 ${alerts.length} whale transactions`,
    `💰 Total: ${totalEth.toFixed(2)} ETH`,
    "",
  ];

  for (const [index, alert] of alerts.entries()) {
    lines.push(
      `${index + 1}. 🐋 ${alert.valueEth} ETH`,
      `   📤 ${alert.fromAddress}`,
      `   📥 ${alert.toAddress ?? "Contract Creation"}`,
      `   🧠 Smart Money Score: ${
        alert.smartMoneyScore ?? "N/A"
      }/100`,
      `   🔗 ${alert.hash}`,
      `   📦 Block: ${alert.blockNumber.toString()}`,
      "",
    );
  }

  lines.push("🌐 Ethereum Mainnet");

  return lines.join("\n");
}

function splitDigest(
  alerts: UserWhaleAlert[],
): UserWhaleAlert[][] {
  const chunks: UserWhaleAlert[][] = [];

  let current: UserWhaleAlert[] = [];
  let currentLength = 0;

  for (const alert of alerts) {
    const alertText = [
      `${current.length + 1}. 🐋 ${alert.valueEth} ETH`,
      `   📤 ${alert.fromAddress}`,
      `   📥 ${alert.toAddress ?? "Contract Creation"}`,
      `   🧠 Smart Money Score: ${
        alert.smartMoneyScore ?? "N/A"
      }/100`,
      `   🔗 ${alert.hash}`,
      `   📦 Block: ${alert.blockNumber.toString()}`,
      "",
    ].join("\n");

    if (
      current.length > 0 &&
      currentLength + alertText.length >
        MAX_MESSAGE_LENGTH
    ) {
      chunks.push(current);

      current = [];
      currentLength = 0;
    }

    current.push(alert);
    currentLength += alertText.length;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

async function processDigest(): Promise<void> {
  if (isRunning) {
    console.log("⏳ Digest already running");
    return;
  }

  isRunning = true;

  try {
    const alerts =
      await getPendingUserWhaleAlerts(100);

    if (alerts.length === 0) {
      console.log(
        "🐋 No pending user whale alerts",
      );

      return;
    }

    console.log(
      `🐋 Preparing user whale digest: ${alerts.length} alerts`,
    );

    // Group alerts by Telegram chat ID.
    const alertsByChatId = new Map<
      string,
      UserWhaleAlert[]
    >();

    for (const alert of alerts) {
      if (!alert.chatId) {
        console.log(
          `⚠️ No Telegram chat configured for user ${alert.userId}`,
        );

        continue;
      }

      const existing =
        alertsByChatId.get(alert.chatId) ?? [];

      existing.push(alert);

      alertsByChatId.set(
        alert.chatId,
        existing,
      );
    }

    for (const [
      chatId,
      userAlerts,
    ] of alertsByChatId.entries()) {
      const chunks = splitDigest(userAlerts);

      console.log(
        `📨 Sending ${userAlerts.length} alerts in ${chunks.length} messages`,
      );

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (!chunk) {
          continue;
        }

        const message = formatDigest(
          chunk,
          i + 1,
          chunks.length,
        );

        await sendTelegramAlert(
          chatId,
          message,
        );

        for (const alert of chunk) {
          await markUserWhaleAlertSent(
            alert.userWhaleAlertId,
          );
        }
      }
    }

    console.log(
      `✅ User whale digest processed: ${alerts.length} alerts`,
    );
  } catch (error) {
    console.error(
      "❌ Whale digest failed:",
    );

    console.error(error);
  } finally {
    isRunning = false;
  }
}

export function startWhaleDigest(): void {
  console.log(
    `🐋 Whale digest worker started — every ${DIGEST_INTERVAL_MINUTES} minutes`,
  );

  // Run once shortly after startup.
  void processDigest();

  setInterval(() => {
    void processDigest();
  }, DIGEST_INTERVAL_MS);
}

