import { desc } from "drizzle-orm";
import { db } from "./client";
import { tokens } from "./schema/tokens";

async function main() {
  const rows = await db
    .select()
    .from(tokens)
    .orderBy(desc(tokens.createdAt))
    .limit(10);

  console.log("🪙 Latest tokens:");

  for (const token of rows) {
    console.log("────────────────────────────────");
    console.log("Address:", token.address);
    console.log("Name:", token.name);
    console.log("Symbol:", token.symbol);
    console.log("Decimals:", token.decimals);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Database error:");
  console.error(error);
  process.exit(1);
});