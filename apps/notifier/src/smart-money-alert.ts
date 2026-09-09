import { sendTelegramMessage } from "./telegram.js";

import {
  hasSmartMoneyAlert,
  saveSmartMoneyAlert,
} from "db";

const API_URL =
  process.env.API_URL ??
  "http://localhost:3000";

type SmartMoneyCandidate = {
  wallet: string;
  addressType: "EOA";
  score: number;
  transactions: number;
  largeTransactions: number;
  inflowUsd: number;
  outflowUsd: number;
  netFlowUsd: number;
};

type SmartMoneyResponse = {
  data: SmartMoneyCandidate[];

  meta: {
    count: number;
    limit: number;
    scoreThreshold: number;
  };
};

function formatUsd(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function shortenAddress(
  address: string,
) {
  return `${address.slice(
    0,
    6,
  )}...${address.slice(-4)}`;
}

async function main() {
  const response =
    await fetch(
      `${API_URL}/api/smart-money/candidates?scoreThreshold=60&limit=20`,
    );

  if (!response.ok) {
    throw new Error(
      `API error: ${response.status} ${await response.text()}`,
    );
  }

  const result =
    (await response.json()) as SmartMoneyResponse;

  if (result.data.length === 0) {
    console.log(
      "No smart money candidates found",
    );

    return;
  }

  for (
    const candidate of result.data
  ) {
    const alreadySent =
      await hasSmartMoneyAlert(
        candidate.wallet,
      );

    if (alreadySent) {
      console.log(
        `⏭️ Alert already sent: ${candidate.wallet}`,
      );

      continue;
    }

    const message = [
      "🐋 WhaleRadar Smart Money Alert",
      "",
      `Wallet: ${shortenAddress(
        candidate.wallet,
      )}`,
      `Score: ${candidate.score}/100`,
      `Transactions: ${candidate.transactions}`,
      `Large transactions: ${candidate.largeTransactions}`,
      "",
      `💰 Inflow: ${formatUsd(
        candidate.inflowUsd,
      )}`,
      `📤 Outflow: ${formatUsd(
        candidate.outflowUsd,
      )}`,
      `📈 Net flow: ${formatUsd(
        candidate.netFlowUsd,
      )}`,
    ].join("\n");

    await sendTelegramMessage(
      message,
    );

    await saveSmartMoneyAlert(
      candidate.wallet,
      candidate.score,
      candidate.netFlowUsd,
    );

    console.log(
      `✅ Alert sent: ${candidate.wallet}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});