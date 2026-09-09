import { and, eq } from "drizzle-orm";
import {
  db,
  tokenPrices,
  tokenTransfers,
  tokens,
} from "./index.js";

const LARGE_TX_THRESHOLD_USD = 10_000;

async function main() {
  const transfers = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      fromAddress: tokenTransfers.fromAddress,
      toAddress: tokenTransfers.toAddress,
      amountRaw: tokenTransfers.amountRaw,

      tokenDecimals: tokens.decimals,
      priceUsd: tokenPrices.priceUsd,
    })
    .from(tokenTransfers)
    .innerJoin(
      tokens,
      and(
        eq(tokens.chain, tokenTransfers.chain),
        eq(tokens.address, tokenTransfers.tokenAddress),
      ),
    )
    .leftJoin(
      tokenPrices,
      and(
        eq(
          tokenPrices.chain,
          tokenTransfers.chain,
        ),
        eq(
          tokenPrices.tokenAddress,
          tokenTransfers.tokenAddress,
        ),
      ),
    );

  type WalletActivity = {
    wallet: string;
    transactionHashes: Set<string>;
    largeTransactions: Set<string>;
    inflowUsd: number;
    outflowUsd: number;
    netFlowUsd: number;
  };

  const walletMap = new Map<string, WalletActivity>();

  // First calculate transaction USD totals.
  const transactionTotals = new Map<string, number>();

  for (const transfer of transfers) {
    if (!transfer.priceUsd) {
      continue;
    }

    const amount =
      Number(transfer.amountRaw) /
      10 ** transfer.tokenDecimals;

    const valueUsd =
      amount * Number(transfer.priceUsd);

    if (!Number.isFinite(valueUsd)) {
      continue;
    }

    const current =
      transactionTotals.get(
        transfer.transactionHash,
      ) ?? 0;

    transactionTotals.set(
      transfer.transactionHash,
      current + valueUsd,
    );
  }

  function getWallet(address: string) {
    const wallet = address.toLowerCase();

    if (!walletMap.has(wallet)) {
      walletMap.set(wallet, {
        wallet,
        transactionHashes: new Set(),
        largeTransactions: new Set(),
        inflowUsd: 0,
        outflowUsd: 0,
        netFlowUsd: 0,
      });
    }

    return walletMap.get(wallet)!;
  }

  for (const transfer of transfers) {
    if (!transfer.priceUsd) {
      continue;
    }

    const amount =
      Number(transfer.amountRaw) /
      10 ** transfer.tokenDecimals;

    const valueUsd =
      amount * Number(transfer.priceUsd);

    if (!Number.isFinite(valueUsd) || valueUsd === 0) {
      continue;
    }

    const from = getWallet(transfer.fromAddress);
    const to = getWallet(transfer.toAddress);

    const txTotal =
      transactionTotals.get(
        transfer.transactionHash,
      ) ?? 0;

    from.transactionHashes.add(
      transfer.transactionHash,
    );

    to.transactionHashes.add(
      transfer.transactionHash,
    );

    if (txTotal >= LARGE_TX_THRESHOLD_USD) {
      from.largeTransactions.add(
        transfer.transactionHash,
      );

      to.largeTransactions.add(
        transfer.transactionHash,
      );
    }

    from.outflowUsd += valueUsd;
    from.netFlowUsd -= valueUsd;

    to.inflowUsd += valueUsd;
    to.netFlowUsd += valueUsd;
  }

  const activities = [...walletMap.values()]
    .map((wallet) => ({
      wallet: wallet.wallet,
      transactions: wallet.transactionHashes.size,
      largeTransactions:
        wallet.largeTransactions.size,
      inflowUsd: wallet.inflowUsd,
      outflowUsd: wallet.outflowUsd,
      netFlowUsd: wallet.netFlowUsd,
    }))
    .filter(
      (wallet) =>
        Math.abs(wallet.netFlowUsd) >=
        LARGE_TX_THRESHOLD_USD,
    )
    .sort(
      (a, b) =>
        Math.abs(b.netFlowUsd) -
        Math.abs(a.netFlowUsd),
    );

  console.log("🧠 Wallet activity:");
  console.log(
    `Large transaction threshold: $${LARGE_TX_THRESHOLD_USD.toLocaleString()}`,
  );
  console.log("────────────────────────────────");

  for (const wallet of activities) {
    const direction =
      wallet.netFlowUsd >= 0
        ? "🟢 INFLOW"
        : "🔴 OUTFLOW";

    console.log(direction);
    console.log(`Wallet: ${wallet.wallet}`);
    console.log(
      `Transactions: ${wallet.transactions}`,
    );
    console.log(
      `Large transactions: ${wallet.largeTransactions}`,
    );
    console.log(
      `Inflow: $${wallet.inflowUsd.toFixed(2)}`,
    );
    console.log(
      `Outflow: $${wallet.outflowUsd.toFixed(2)}`,
    );
    console.log(
      `Net Flow: $${wallet.netFlowUsd.toFixed(2)}`,
    );
    console.log("────────────────────────────────");
  }

  console.log(`Wallets: ${activities.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});