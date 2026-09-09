import { and, eq } from "drizzle-orm";
import {
  db,
  tokenPrices,
  tokenTransfers,
  tokens,
} from "db";

const NET_FLOW_THRESHOLD = 10_000;

type WalletActivity = {
  wallet: string;
  transactionHashes: Set<string>;
  largeTransactions: Set<string>;
  inflowUsd: number;
  outflowUsd: number;
  netFlowUsd: number;
};

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

  const transactionTotals = new Map<string, number>();

  for (const transfer of transfers) {
    if (!transfer.priceUsd) continue;

    const amount =
      Number(transfer.amountRaw) /
      10 ** transfer.tokenDecimals;

    const valueUsd =
      amount * Number(transfer.priceUsd);

    if (!Number.isFinite(valueUsd)) continue;

    transactionTotals.set(
      transfer.transactionHash,
      (transactionTotals.get(
        transfer.transactionHash,
      ) ?? 0) + valueUsd,
    );
  }

  const wallets = new Map<string, WalletActivity>();

  function getWallet(address: string) {
    const wallet = address.toLowerCase();

    if (!wallets.has(wallet)) {
      wallets.set(wallet, {
        wallet,
        transactionHashes: new Set(),
        largeTransactions: new Set(),
        inflowUsd: 0,
        outflowUsd: 0,
        netFlowUsd: 0,
      });
    }

    return wallets.get(wallet)!;
  }

  for (const transfer of transfers) {
    if (!transfer.priceUsd) continue;

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

    if (txTotal >= NET_FLOW_THRESHOLD) {
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

  const results = [...wallets.values()]
    .filter(
      (wallet) =>
        Math.abs(wallet.netFlowUsd) >=
        NET_FLOW_THRESHOLD,
    )
    .map((wallet) => {
      let score = 0;

      // Net flow size
      if (Math.abs(wallet.netFlowUsd) >= 10_000) {
        score += 20;
      }

      if (Math.abs(wallet.netFlowUsd) >= 50_000) {
        score += 20;
      }

      if (Math.abs(wallet.netFlowUsd) >= 100_000) {
        score += 20;
      }

      // Large transaction activity
      if (wallet.largeTransactions.size >= 2) {
        score += 15;
      }

      // General activity
      if (wallet.transactionHashes.size >= 3) {
        score += 15;
      }

      // Positive net flow
      if (wallet.netFlowUsd > 0) {
        score += 10;
      }

      return {
        wallet: wallet.wallet,
        score,
        transactions: wallet.transactionHashes.size,
        largeTransactions:
          wallet.largeTransactions.size,
        inflowUsd: wallet.inflowUsd,
        outflowUsd: wallet.outflowUsd,
        netFlowUsd: wallet.netFlowUsd,
      };
    })
    .sort((a, b) => b.score - a.score);

  console.log("🧠 Smart Money Scores");
  console.log("────────────────────────────────");

  for (const wallet of results) {
    console.log(`Score: ${wallet.score}/100`);
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

  console.log(`Wallets scored: ${results.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});