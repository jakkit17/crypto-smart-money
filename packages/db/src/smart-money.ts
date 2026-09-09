import { eq } from "drizzle-orm";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { db } from "./client.js";
import { tokenTransfers } from "./schema/token-transfers.js";
import { tokens } from "./schema/tokens.js";
import { tokenPrices } from "./schema/token-prices.js";
import { smartMoneyAlerts } from "./schema/smart-money-alerts.js";

import {
  calculateSmartMoneyScore,
  classifyAddressType,
} from "shared";

const rpcUrl = process.env.ETHEREUM_RPC_URL;

if (!rpcUrl) {
  throw new Error("ETHEREUM_RPC_URL is not set");
}

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

export type SmartMoneyWalletActivity = {
  wallet: string;
  transactions: Set<string>;
  largeTransactions: Set<string>;
  inflow: number;
  outflow: number;
};

export type SmartMoneyCandidate = {
  wallet: string;
  addressType: "EOA";
  score: number;
  transactions: number;
  largeTransactions: number;
  inflowUsd: number;
  outflowUsd: number;
  netFlowUsd: number;
};

export async function getSmartMoneyWalletActivity(
  thresholdUsd = 10_000,
): Promise<SmartMoneyWalletActivity[]> {
  const rows = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      fromAddress: tokenTransfers.fromAddress,
      toAddress: tokenTransfers.toAddress,
      amountRaw: tokenTransfers.amountRaw,
      decimals: tokens.decimals,
      priceUsd: tokenPrices.priceUsd,
    })
    .from(tokenTransfers)
    .innerJoin(
      tokens,
      eq(
        tokenTransfers.tokenAddress,
        tokens.address,
      ),
    )
    .innerJoin(
      tokenPrices,
      eq(
        tokenTransfers.tokenAddress,
        tokenPrices.tokenAddress,
      ),
    );

  const transactionTotals = new Map<string, number>();

  for (const row of rows) {
    const amount =
      Number(row.amountRaw) /
      10 ** row.decimals;

    const price = Number(row.priceUsd);

    const valueUsd = amount * price;

    transactionTotals.set(
      row.transactionHash,
      (transactionTotals.get(row.transactionHash) ?? 0) +
        valueUsd,
    );
  }

  const wallets = new Map<
    string,
    SmartMoneyWalletActivity
  >();

  for (const row of rows) {
    const amount =
      Number(row.amountRaw) /
      10 ** row.decimals;

    const price = Number(row.priceUsd);

    const valueUsd = amount * price;

    const txTotal =
      transactionTotals.get(row.transactionHash) ?? 0;

    const addresses = [
      {
        address: row.fromAddress.toLowerCase(),
        type: "outflow" as const,
      },
      {
        address: row.toAddress.toLowerCase(),
        type: "inflow" as const,
      },
    ];

    for (const item of addresses) {
      if (
        item.address ===
        "0x0000000000000000000000000000000000000000"
      ) {
        continue;
      }

      let activity = wallets.get(item.address);

      if (!activity) {
        activity = {
          wallet: item.address,
          transactions: new Set(),
          largeTransactions: new Set(),
          inflow: 0,
          outflow: 0,
        };

        wallets.set(item.address, activity);
      }

      activity.transactions.add(
        row.transactionHash,
      );

      if (txTotal >= thresholdUsd) {
        activity.largeTransactions.add(
          row.transactionHash,
        );
      }

      if (item.type === "inflow") {
        activity.inflow += valueUsd;
      } else {
        activity.outflow += valueUsd;
      }
    }
  }

  return [...wallets.values()].sort(
    (a, b) =>
      (b.inflow - b.outflow) -
      (a.inflow - a.outflow),
  );
}

export async function getSmartMoneyCandidates(
  thresholdUsd = 10_000,
  scoreThreshold = 30,
): Promise<SmartMoneyCandidate[]> {
  const activities =
    await getSmartMoneyWalletActivity(
      thresholdUsd,
    );

  const candidates: SmartMoneyCandidate[] = [];

  for (const activity of activities) {
    if (
      activity.wallet ===
      "0x0000000000000000000000000000000000000000"
    ) {
      continue;
    }

    const code = await client.getCode({
      address:
        activity.wallet as `0x${string}`,
    });

    const addressType =
      classifyAddressType(code);

    if (addressType !== "EOA") {
      continue;
    }

    const result =
      calculateSmartMoneyScore({
        transactions:
          activity.transactions.size,
        largeTransactions:
          activity.largeTransactions.size,
        inflowUsd: activity.inflow,
        outflowUsd: activity.outflow,
      });

    if (result.score < scoreThreshold) {
      continue;
    }

    candidates.push({
      wallet: activity.wallet,
      addressType: "EOA",
      score: result.score,
      transactions:
        activity.transactions.size,
      largeTransactions:
        activity.largeTransactions.size,
      inflowUsd: activity.inflow,
      outflowUsd: activity.outflow,
      netFlowUsd: result.netFlowUsd,
    });
  }

  return candidates.sort(
    (a, b) => b.score - a.score,
  );
}

/**
 * Check whether this wallet has already
 * triggered a Smart Money alert.
 */
export async function hasSmartMoneyAlert(
  wallet: string,
): Promise<boolean> {
  const rows = await db
    .select({
      id: smartMoneyAlerts.id,
    })
    .from(smartMoneyAlerts)
    .where(
      eq(
        smartMoneyAlerts.wallet,
        wallet,
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Save a Smart Money alert after
 * the Telegram message was sent successfully.
 */
export async function saveSmartMoneyAlert(
  wallet: string,
  score: number,
  netFlowUsd: number,
) {
  await db.insert(smartMoneyAlerts).values({
    wallet,
    score,
    netFlowUsd:
      netFlowUsd.toString(),
  });
}