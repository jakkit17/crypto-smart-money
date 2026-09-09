import { desc, eq, and } from "drizzle-orm";
import { db } from "./client";
import { tokenTransfers } from "./schema/token-transfers";
import { tokens } from "./schema/tokens";
import { formatTokenAmount } from "shared";


async function main() {
  const transfers = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      tokenAddress: tokenTransfers.tokenAddress,
      fromAddress: tokenTransfers.fromAddress,
      toAddress: tokenTransfers.toAddress,
      amountRaw: tokenTransfers.amountRaw,
      timestamp: tokenTransfers.timestamp,

      symbol: tokens.symbol,
      decimals: tokens.decimals,
    })
    .from(tokenTransfers)
    .leftJoin(
      tokens,
      and(
        eq(tokenTransfers.chain, tokens.chain),
        eq(tokenTransfers.tokenAddress, tokens.address),
      ),
    )
    .orderBy(desc(tokenTransfers.createdAt))
    .limit(10);

  console.log("🪙 Enriched token transfers:");

  for (const transfer of transfers) {
    const amount = transfer.decimals !== null
      ? formatTokenAmount(
          transfer.amountRaw,
          transfer.decimals,
        )
      : transfer.amountRaw;

    console.log("────────────────────────────────");
    console.log("Token:", transfer.symbol ?? transfer.tokenAddress);
    console.log("Amount:", amount);
    console.log("From:", transfer.fromAddress);
    console.log("To:", transfer.toAddress);
    console.log("Tx:", transfer.transactionHash);
    console.log("Timestamp:", transfer.timestamp);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Database error:");
  console.error(error);
  process.exit(1);
});