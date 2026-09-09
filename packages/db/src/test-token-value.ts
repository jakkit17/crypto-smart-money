import { db } from "db";
import { eq, and } from "drizzle-orm";
import { tokenTransfers } from "./schema/token-transfers";
import { tokens } from "./schema/tokens";
import { tokenPrices } from "./schema/token-prices";
import { formatTokenAmount } from "shared";

async function main() {
  const transfers = await db
    .select({
      transactionHash: tokenTransfers.transactionHash,
      tokenAddress: tokenTransfers.tokenAddress,
      amountRaw: tokenTransfers.amountRaw,
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
    .limit(20);

  console.log("💰 Token values:");

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

    console.log("────────────────────────────────");
    console.log("Token:", transfer.symbol ?? transfer.tokenAddress);
    console.log("Amount:", amount);
    console.log("Price:", `$${transfer.priceUsd}`);
    console.log("USD Value:", `$${valueUsd.toFixed(2)}`);
    console.log("Tx:", transfer.transactionHash);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Database error:");
  console.error(error);
  process.exit(1);
});