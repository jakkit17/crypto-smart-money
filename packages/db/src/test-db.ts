import { db } from "./client";
import { wallets } from "./schema/wallets";

async function main() {
  const [wallet] = await db
    .insert(wallets)
    .values({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chain: "ethereum",
      label: "Test Wallet",
    })
    .returning();

  console.log("✅ Wallet created:");
  console.log(wallet);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Database error:");
  console.error(error);
  process.exit(1);
});