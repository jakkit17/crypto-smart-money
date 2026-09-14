import { config } from "dotenv";

config({
  path: "../../.env",
});

import {
  getPendingWhaleAlerts,
  markWhaleAlertsSent,
} from "db";
import { sendTelegramAlert } from "./telegram.js";

const DIGEST_INTERVAL_MINUTES = Number(
  process.env.WHALE_DIGEST_INTERVAL_MINUTES ?? "5",
);

const DIGEST_INTERVAL_MS =
  DIGEST_INTERVAL_MINUTES * 60 * 1000;

let isRunning = false;

function formatDigest(
  alerts: Awaited<ReturnType<typeof getPendingWhaleAlerts>>,
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
      `   🔗 ${alert.hash}`,
      `   📦 Block: ${alert.blockNumber.toString()}`,
      "",
    );
  }

  lines.push("🌐 Ethereum Mainnet");

  return lines.join("\n");
}

function splitDigest(
  alerts: Awaited<ReturnType<typeof getPendingWhaleAlerts>>,
): typeof alerts[] {
  const MAX_LENGTH = 3500;
  const chunks: typeof alerts[] = [];
  let current: typeof alerts = [];
  let currentLength = 0;

  for (const alert of alerts) {
    const alertText = [
      `🐋 ${alert.valueEth} ETH`,
      `   📤 ${alert.fromAddress}`,
      `   📥 ${alert.toAddress ?? "Contract Creation"}`,
      `   🔗 ${alert.hash}`,
      `   📦 Block: ${alert.blockNumber.toString()}`,
      "",
    ].join("\n");

    if (
      current.length > 0 &&
      currentLength + alertText.length > MAX_LENGTH
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
    const alerts = await getPendingWhaleAlerts(100);

    if (alerts.length === 0) {
      console.log("🐋 No pending whale alerts");
      return;
    }

    console.log(
      `🐋 Preparing whale digest: ${alerts.length} alerts`,
    );

    const chunks = splitDigest(alerts);

    console.log(
    `🐋 Preparing whale digest: ${alerts.length} alerts in ${chunks.length} messages`,
    );

    for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const message = formatDigest(
        chunk,
        i + 1,
        chunks.length,
    );

    await sendTelegramAlert(message);

    await markWhaleAlertsSent(
        chunk.map((alert) => alert.id),
    );
    }

    console.log(
    `✅ Whale digest sent: ${alerts.length} alerts in ${chunks.length} messages`,
    );

    console.log(
      `✅ Whale digest sent: ${alerts.length} alerts`,
    );
  } catch (error) {
    console.error("❌ Whale digest failed:");
    console.error(error);
  } finally {
    isRunning = false;
  }
}

export function startWhaleDigest(): void {
  console.log(
    "🐋 Whale digest worker started — every 5 minutes",
  );

  // Run once shortly after startup.
  void processDigest();

  setInterval(() => {
    void processDigest();
  }, DIGEST_INTERVAL_MS);
}