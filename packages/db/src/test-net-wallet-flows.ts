import { and, desc, eq } from "drizzle-orm";
import { db, tokenPrices, tokenTransfers, tokens } from "./index.js";

const THRESHOLD_USD = 10_000;

async function main() {
  const transfers = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      tokenAddress: tokenTransfers.tokenAddress,
      fromAddress: tokenTransfers.fromAddress,
      toAddress: tokenTransfers.toAddress,
      amountRaw: tokenTransfers.amountRaw,
      timestamp: tokenTransfers.timestamp,

      tokenSymbol: tokens.symbol,
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
        eq(tokenPrices.chain, tokenTransfers.chain),
        eq(
          tokenPrices.tokenAddress,
          tokenTransfers.tokenAddress,
        ),
      ),
    )
    .orderBy(desc(tokenTransfers.timestamp));

  type WalletFlow = {
    wallet: string;
    inflowUsd: number;
    outflowUsd: number;
    netFlowUsd: number;
  };

  const walletMap = new Map<string, WalletFlow>();

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

    const from = transfer.fromAddress.toLowerCase();
    const to = transfer.toAddress.toLowerCase();

    if (!walletMap.has(from)) {
      walletMap.set(from, {
        wallet: from,
        inflowUsd: 0,
        outflowUsd: 0,
        netFlowUsd: 0,
      });
    }

    if (!walletMap.has(to)) {
      walletMap.set(to, {
        wallet: to,
        inflowUsd: 0,
        outflowUsd: 0,
        netFlowUsd: 0,
      });
    }

    const fromFlow = walletMap.get(from)!;
    const toFlow = walletMap.get(to)!;

    fromFlow.outflowUsd += valueUsd;
    fromFlow.netFlowUsd -= valueUsd;

    toFlow.inflowUsd += valueUsd;
    toFlow.netFlowUsd += valueUsd;
  }

  const whaleWallets = [...walletMap.values()]
    .filter(
      (wallet) =>
        Math.abs(wallet.netFlowUsd) >= THRESHOLD_USD,
    )
    .sort(
      (a, b) =>
        Math.abs(b.netFlowUsd) -
        Math.abs(a.netFlowUsd),
    );

  console.log("🐋 Net wallet flows:");
  console.log(
    `Threshold: $${THRESHOLD_USD.toLocaleString()}`,
  );
  console.log("────────────────────────────────");

  for (const wallet of whaleWallets) {
    const direction =
      wallet.netFlowUsd > 0
        ? "🟢 INFLOW"
        : "🔴 OUTFLOW";

    console.log(direction);
    console.log(`Wallet: ${wallet.wallet}`);
    console.log(
      `Inflow: $${wallet.inflowUsd.toFixed(2)}`,
    );
    console.log(
      `Outflow: $${wallet.outflowUsd.toFixed(2)}`,
    );
    console.log(
      `Net: $${wallet.netFlowUsd.toFixed(2)}`,
    );
    console.log("────────────────────────────────");
  }

  console.log(`Whale wallets: ${whaleWallets.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});