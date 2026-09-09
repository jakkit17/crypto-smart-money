import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { db, tokenTransfers, tokens, tokenPrices } from "./index.js";
import { sql } from "drizzle-orm";
import { classifyAddressType } from "shared";

config({
  path: "../../.env",
});

const rpcUrl = process.env.ETHEREUM_RPC_URL;

if (!rpcUrl) {
  throw new Error("ETHEREUM_RPC_URL is not set");
}

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

const LARGE_TX_THRESHOLD = 10_000;

type WalletActivity = {
  wallet: string;
  transactions: Set<string>;
  largeTransactions: Set<string>;
  inflow: number;
  outflow: number;
};

async function main() {
  const rows = await db
    .select({
      txHash: tokenTransfers.transactionHash,
      fromAddress: tokenTransfers.fromAddress,
      toAddress: tokenTransfers.toAddress,
      amountRaw: tokenTransfers.amountRaw,
      decimals: tokens.decimals,
      priceUsd: tokenPrices.priceUsd,
    })
    .from(tokenTransfers)
    .innerJoin(
      tokens,
      sql`
        lower(${tokenTransfers.tokenAddress})
        =
        lower(${tokens.address})
      `,
    )
    .innerJoin(
      tokenPrices,
      sql`
        lower(${tokenTransfers.tokenAddress})
        =
        lower(${tokenPrices.tokenAddress})
      `,
    );

  const txTotals = new Map<string, number>();

  for (const row of rows) {
    const amount = Number(row.amountRaw) / 10 ** row.decimals;
    const valueUsd = amount * Number(row.priceUsd);

    txTotals.set(
      row.txHash,
      (txTotals.get(row.txHash) ?? 0) + valueUsd,
    );
  }

  const wallets = new Map<string, WalletActivity>();

  for (const row of rows) {
    const from = row.fromAddress.toLowerCase();
    const to = row.toAddress.toLowerCase();

    const amount = Number(row.amountRaw) / 10 ** row.decimals;
    const valueUsd = amount * Number(row.priceUsd);

    const txTotal = txTotals.get(row.txHash) ?? 0;
    const isLarge = txTotal >= LARGE_TX_THRESHOLD;

    if (!wallets.has(from)) {
      wallets.set(from, {
        wallet: from,
        transactions: new Set(),
        largeTransactions: new Set(),
        inflow: 0,
        outflow: 0,
      });
    }

    if (!wallets.has(to)) {
      wallets.set(to, {
        wallet: to,
        transactions: new Set(),
        largeTransactions: new Set(),
        inflow: 0,
        outflow: 0,
      });
    }

    const fromWallet = wallets.get(from)!;
    const toWallet = wallets.get(to)!;

    fromWallet.transactions.add(row.txHash);
    toWallet.transactions.add(row.txHash);

    if (isLarge) {
      fromWallet.largeTransactions.add(row.txHash);
      toWallet.largeTransactions.add(row.txHash);
    }

    fromWallet.outflow += valueUsd;
    toWallet.inflow += valueUsd;
  }

  const results = [];

  for (const activity of wallets.values()) {
    const code = await client.getCode({
      address: activity.wallet as `0x${string}`,
    });

    const addressType = classifyAddressType(code);

    if (addressType !== "EOA") {
      continue;
    }

    const netFlow = activity.inflow - activity.outflow;

    let score = 0;

    // Net flow magnitude
    if (Math.abs(netFlow) >= 10_000) {
      score += 20;
    }

    if (Math.abs(netFlow) >= 50_000) {
      score += 20;
    }

    if (Math.abs(netFlow) >= 100_000) {
      score += 20;
    }

    // Activity
    if (activity.largeTransactions.size >= 2) {
      score += 15;
    }

    if (activity.transactions.size >= 3) {
      score += 15;
    }

    // Positive net flow = stronger Smart Money signal
    if (netFlow > 0) {
      score += 10;
    }

    results.push({
      ...activity,
      netFlow,
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);

  console.log("🧠 Smart Money Scores v2");
  console.log("────────────────────────────────");

  for (const wallet of results) {
    console.log(`Score: ${wallet.score}/100`);
    console.log(`Wallet: ${wallet.wallet}`);
    console.log(`Transactions: ${wallet.transactions.size}`);
    console.log(
      `Large transactions: ${wallet.largeTransactions.size}`,
    );
    console.log(
      `Inflow: $${wallet.inflow.toFixed(2)}`,
    );
    console.log(
      `Outflow: $${wallet.outflow.toFixed(2)}`,
    );
    console.log(
      `Net Flow: $${wallet.netFlow.toFixed(2)}`,
    );
    console.log("────────────────────────────────");
  }

  console.log(`EOA wallets scored: ${results.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});