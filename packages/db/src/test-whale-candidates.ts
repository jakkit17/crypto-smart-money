import { and, desc, eq } from "drizzle-orm";
import { db } from "./index.js";
import { tokenTransfers } from "./schema/token-transfers.js";
import { tokens } from "./schema/tokens.js";
import { tokenPrices } from "./schema/token-prices.js";
import { formatTokenAmount } from "shared";

const WHALE_THRESHOLD_USD = 10_000;

async function main() {
  const transfers = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      amountRaw: tokenTransfers.amountRaw,
      tokenAddress: tokenTransfers.tokenAddress,
      symbol: tokens.symbol,
      decimals: tokens.decimals,
      priceUsd: tokenPrices.priceUsd,
      timestamp: tokenTransfers.timestamp,
    })
    .from(tokenTransfers)
    .leftJoin(
      tokens,
      and(
        eq(tokenTransfers.chain, tokens.chain),
        eq(tokenTransfers.tokenAddress, tokens.address),
      ),
    )
    .leftJoin(
      tokenPrices,
      and(
        eq(
          tokenTransfers.chain,
          tokenPrices.chain,
        ),
        eq(
          tokenTransfers.tokenAddress,
          tokenPrices.tokenAddress,
        ),
      ),
    )
    .orderBy(desc(tokenTransfers.createdAt));

  const totals = new Map<
    string,
    {
      totalUsd: number;
      timestamp: Date;
    }
  >();

  for (const transfer of transfers) {
    if (
      transfer.decimals === null ||
      transfer.priceUsd === null
    ) {
      continue;
    }

    const amount = formatTokenAmount(
      transfer.amountRaw,
      transfer.decimals,
    );

    const valueUsd =
      Number(amount) * Number(transfer.priceUsd);

    const existing = totals.get(
      transfer.transactionHash,
    );

    if (existing) {
      existing.totalUsd += valueUsd;
    } else {
      totals.set(transfer.transactionHash, {
        totalUsd: valueUsd,
        timestamp: transfer.timestamp,
      });
    }
  }

  const candidates = [...totals.entries()]
    .filter(([, data]) => data.totalUsd >= WHALE_THRESHOLD_USD)
    .sort((a, b) => b[1].totalUsd - a[1].totalUsd);

  console.log("🐋 Whale candidates:");
  console.log(
    `Threshold: $${WHALE_THRESHOLD_USD.toLocaleString()}`,
  );

  for (const [transactionHash, data] of candidates) {
    console.log("────────────────────────────────");
    console.log("Tx:", transactionHash);
    console.log(
      "Total USD:",
      `$${data.totalUsd.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    );
    console.log("Timestamp:", data.timestamp);
  }

  console.log("────────────────────────────────");
  console.log("Candidates:", candidates.length);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Whale detection error:");
  console.error(error);
  process.exit(1);
});