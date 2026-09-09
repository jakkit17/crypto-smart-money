import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "db";
import { tokenTransfers } from "./schema/token-transfers";
import { tokens } from "./schema/tokens";
import { tokenPrices } from "./schema/token-prices";
import { formatTokenAmount } from "shared";

const WHALE_THRESHOLD_USD = 10_000;

async function main() {
  const transfers = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      fromAddress: tokenTransfers.fromAddress,
      toAddress: tokenTransfers.toAddress,
      tokenAddress: tokenTransfers.tokenAddress,
      amountRaw: tokenTransfers.amountRaw,
      timestamp: tokenTransfers.timestamp,

      symbol: tokens.symbol,
      decimals: tokens.decimals,
      priceUsd: tokenPrices.priceUsd,
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
        eq(tokenTransfers.chain, tokenPrices.chain),
        eq(tokenTransfers.tokenAddress, tokenPrices.tokenAddress),
      ),
    )
    .orderBy(desc(tokenTransfers.createdAt));

  const totals = new Map<string, number>();

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

    totals.set(
      transfer.transactionHash,
      (totals.get(transfer.transactionHash) ?? 0) +
        valueUsd,
    );
  }

  const whaleTxHashes = [...totals.entries()]
    .filter(
      ([, totalUsd]) =>
        totalUsd >= WHALE_THRESHOLD_USD,
    )
    .sort((a, b) => b[1] - a[1])
    .map(([hash]) => hash);

  console.log("🐋 Whale flows:");
  console.log(
    `Threshold: $${WHALE_THRESHOLD_USD.toLocaleString()}`,
  );

  for (const txHash of whaleTxHashes) {
    const txTransfers = transfers.filter(
      (transfer) =>
        transfer.transactionHash === txHash &&
        transfer.priceUsd !== null &&
        transfer.decimals !== null,
    );

    const totalUsd = totals.get(txHash) ?? 0;

    console.log("────────────────────────────────");
    console.log(
      `💰 Total: $${totalUsd.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    );
    console.log("Tx:", txHash);
    console.log(
      "Timestamp:",
      txTransfers[0]?.timestamp,
    );

    for (const transfer of txTransfers) {
      const amount = formatTokenAmount(
        transfer.amountRaw,
        transfer.decimals!,
      );

      const valueUsd =
        Number(amount) * Number(transfer.priceUsd);

      console.log("");
      console.log(
        `${transfer.symbol ?? transfer.tokenAddress}: ${amount}`,
      );
      console.log(
        `Value: $${valueUsd.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      );
      console.log("From:", transfer.fromAddress);
      console.log("To:", transfer.toAddress);
    }
  }

  console.log("────────────────────────────────");
  console.log("Whale transactions:", whaleTxHashes.length);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Whale flow error:");
  console.error(error);
  process.exit(1);
});