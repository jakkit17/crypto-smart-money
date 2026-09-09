import {
  and,
  eq,
} from "drizzle-orm";

import {
  createPublicClient,
  http,
} from "viem";

import { mainnet } from "viem/chains";

import { db } from "./client.js";
import {
  tokenTransfers,
  tokens,
  tokenPrices,
  smartMoneyAlerts,
} from "./index.js";

import {
  calculateSmartMoneyScore,
  classifyAddressType,
} from "shared";

const rpcUrl = process.env.ETHEREUM_RPC_URL;

if (!rpcUrl) {
  throw new Error(
    "ETHEREUM_RPC_URL is not set",
  );
}

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

export type SmartMoneyWalletActivity = {
  wallet: string;
  transactions: number;
  largeTransactions: number;
  inflowUsd: number;
  outflowUsd: number;
  netFlowUsd: number;
};

export type SmartMoneyCandidate =
  SmartMoneyWalletActivity & {
    addressType: "EOA";
    score: number;
    transactionHash: string;
  };

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

export async function getSmartMoneyWalletActivity(
  thresholdUsd = 10_000,
): Promise<SmartMoneyWalletActivity[]> {
  const rows = await db
    .select({
      transactionHash:
        tokenTransfers.transactionHash,

      fromAddress:
        tokenTransfers.fromAddress,

      toAddress:
        tokenTransfers.toAddress,

      amountRaw:
        tokenTransfers.amountRaw,

      decimals:
        tokens.decimals,

      priceUsd:
        tokenPrices.priceUsd,
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

  const transactionTotals =
    new Map<string, number>();

  for (const row of rows) {
    const amount =
      Number(row.amountRaw) /
      10 ** row.decimals;

    const price =
      Number(row.priceUsd);

    const valueUsd =
      amount * price;

    transactionTotals.set(
      row.transactionHash,
      (transactionTotals.get(
        row.transactionHash,
      ) ?? 0) + valueUsd,
    );
  }

  const activityMap =
    new Map<
      string,
      SmartMoneyWalletActivity
    >();

  for (const row of rows) {
    const amount =
      Number(row.amountRaw) /
      10 ** row.decimals;

    const price =
      Number(row.priceUsd);

    const valueUsd =
      amount * price;

    const from =
      row.fromAddress.toLowerCase();

    const to =
      row.toAddress.toLowerCase();

    if (from !== ZERO_ADDRESS) {
      const current =
        activityMap.get(from) ??
        {
          wallet: from,
          transactions: 0,
          largeTransactions: 0,
          inflowUsd: 0,
          outflowUsd: 0,
          netFlowUsd: 0,
        };

      current.outflowUsd +=
        valueUsd;

      activityMap.set(
        from,
        current,
      );
    }

    if (to !== ZERO_ADDRESS) {
      const current =
        activityMap.get(to) ??
        {
          wallet: to,
          transactions: 0,
          largeTransactions: 0,
          inflowUsd: 0,
          outflowUsd: 0,
          netFlowUsd: 0,
        };

      current.inflowUsd +=
        valueUsd;

      activityMap.set(
        to,
        current,
      );
    }
  }

  const walletTransactions =
    new Map<
      string,
      Set<string>
    >();

  for (const row of rows) {
    const from =
      row.fromAddress.toLowerCase();

    const to =
      row.toAddress.toLowerCase();

    if (
      from !== ZERO_ADDRESS
    ) {
      if (
        !walletTransactions.has(
          from,
        )
      ) {
        walletTransactions.set(
          from,
          new Set(),
        );
      }

      walletTransactions
        .get(from)!
        .add(
          row.transactionHash,
        );
    }

    if (
      to !== ZERO_ADDRESS
    ) {
      if (
        !walletTransactions.has(
          to,
        )
      ) {
        walletTransactions.set(
          to,
          new Set(),
        );
      }

      walletTransactions
        .get(to)!
        .add(
          row.transactionHash,
        );
    }
  }

  const walletLargeTransactions =
    new Map<
      string,
      Set<string>
    >();

  for (const row of rows) {
    const transactionTotal =
      transactionTotals.get(
        row.transactionHash,
      ) ?? 0;

    if (
      transactionTotal <
      thresholdUsd
    ) {
      continue;
    }

    const from =
      row.fromAddress.toLowerCase();

    const to =
      row.toAddress.toLowerCase();

    if (
      from !== ZERO_ADDRESS
    ) {
      if (
        !walletLargeTransactions.has(
          from,
        )
      ) {
        walletLargeTransactions.set(
          from,
          new Set(),
        );
      }

      walletLargeTransactions
        .get(from)!
        .add(
          row.transactionHash,
        );
    }

    if (
      to !== ZERO_ADDRESS
    ) {
      if (
        !walletLargeTransactions.has(
          to,
        )
      ) {
        walletLargeTransactions.set(
          to,
          new Set(),
        );
      }

      walletLargeTransactions
        .get(to)!
        .add(
          row.transactionHash,
        );
    }
  }

  for (
    const [
      wallet,
      activity,
    ] of activityMap
  ) {
    activity.transactions =
      walletTransactions.get(
        wallet,
      )?.size ?? 0;

    activity.largeTransactions =
      walletLargeTransactions.get(
        wallet,
      )?.size ?? 0;

    activity.netFlowUsd =
      activity.inflowUsd -
      activity.outflowUsd;
  }

  return Array.from(
    activityMap.values(),
  );
}

export async function getSmartMoneyCandidates(
  thresholdUsd = 10_000,
  scoreThreshold = 30,
): Promise<SmartMoneyCandidate[]> {
  const activity =
    await getSmartMoneyWalletActivity(
      thresholdUsd,
    );

  const rows = await db
    .select({
      transactionHash:
        tokenTransfers.transactionHash,

      fromAddress:
        tokenTransfers.fromAddress,

      toAddress:
        tokenTransfers.toAddress,

      amountRaw:
        tokenTransfers.amountRaw,

      decimals:
        tokens.decimals,

      priceUsd:
        tokenPrices.priceUsd,
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

  const transactionTotals =
    new Map<string, number>();

  for (const row of rows) {
    const amount =
      Number(row.amountRaw) /
      10 ** row.decimals;

    const price =
      Number(row.priceUsd);

    const valueUsd =
      amount * price;

    transactionTotals.set(
      row.transactionHash,
      (transactionTotals.get(
        row.transactionHash,
      ) ?? 0) + valueUsd,
    );
  }

  const walletTransactions =
    new Map<
      string,
      Set<string>
    >();

  for (const row of rows) {
    const transactionTotal =
      transactionTotals.get(
        row.transactionHash,
      ) ?? 0;

    if (
      transactionTotal <
      thresholdUsd
    ) {
      continue;
    }

    const from =
      row.fromAddress.toLowerCase();

    const to =
      row.toAddress.toLowerCase();

    if (
      from !== ZERO_ADDRESS
    ) {
      if (
        !walletTransactions.has(
          from,
        )
      ) {
        walletTransactions.set(
          from,
          new Set(),
        );
      }

      walletTransactions
        .get(from)!
        .add(
          row.transactionHash,
        );
    }

    if (
      to !== ZERO_ADDRESS
    ) {
      if (
        !walletTransactions.has(
          to,
        )
      ) {
        walletTransactions.set(
          to,
          new Set(),
        );
      }

      walletTransactions
        .get(to)!
        .add(
          row.transactionHash,
        );
    }
  }

  const candidates: SmartMoneyCandidate[] =
    [];

  for (const walletActivity of activity) {
    const wallet =
      walletActivity.wallet.toLowerCase();

    if (
      wallet === ZERO_ADDRESS
    ) {
      continue;
    }

    const code =
      await publicClient.getCode({
        address:
          wallet as `0x${string}`,
      });

    const addressType =
      classifyAddressType(code);

    if (
      addressType !== "EOA"
    ) {
      continue;
    }

    const score =
      calculateSmartMoneyScore(
        walletActivity,
      );

    if (
      score.score <
      scoreThreshold
    ) {
      continue;
    }

    const transactions =
      Array.from(
        walletTransactions.get(
          wallet,
        ) ?? [],
      );

    const transactionHash =
      transactions
        .sort(
          (a, b) =>
            (transactionTotals.get(
              b,
            ) ?? 0) -
            (transactionTotals.get(
              a,
            ) ?? 0),
        )[0];

    if (!transactionHash) {
      continue;
    }

    candidates.push({
      ...walletActivity,
      addressType,
      score: score.score,
      transactionHash,
    });
  }

  return candidates.sort(
    (a, b) =>
      b.score - a.score ||
      Math.abs(b.netFlowUsd) -
        Math.abs(a.netFlowUsd),
  );
}

export async function hasSmartMoneyAlert(
  wallet: string,
  transactionHash: string,
): Promise<boolean> {
  const rows = await db
    .select({
      id: smartMoneyAlerts.id,
    })
    .from(smartMoneyAlerts)
    .where(
      and(
        eq(
          smartMoneyAlerts.wallet,
          wallet,
        ),
        eq(
          smartMoneyAlerts.transactionHash,
          transactionHash,
        ),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function saveSmartMoneyAlert(
  wallet: string,
  transactionHash: string,
  score: number,
  netFlowUsd: number,
) {
  await db
    .insert(smartMoneyAlerts)
    .values({
      wallet,
      transactionHash,
      score,
      netFlowUsd:
        netFlowUsd.toString(),
    });
}