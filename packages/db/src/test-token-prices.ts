import { db, tokenPrices } from "db";

async function main() {
  const prices = [
    {
        chain: "ethereum",
        tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        priceUsd: "1",
        source: "mock",
    },
    {
        chain: "ethereum",
        tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        priceUsd: "1",
        source: "mock",
    },
    {
        chain: "ethereum",
        tokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        priceUsd: "4000",
        source: "mock",
    },
    ];

  for (const price of prices) {
    await db
      .insert(tokenPrices)
      .values(price)
      .onConflictDoUpdate({
        target: [
          tokenPrices.chain,
          tokenPrices.tokenAddress,
        ],
        set: {
          priceUsd: price.priceUsd,
          source: price.source,
          updatedAt: new Date(),
        },
      });

    console.log(
      "💰 Saved:",
      price.tokenAddress,
      `$${price.priceUsd}`,
    );
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Database error:");
  console.error(error);
  process.exit(1);
});