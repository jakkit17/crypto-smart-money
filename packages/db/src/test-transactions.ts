import { desc } from "drizzle-orm";
import { db } from "./client";
import { transactions } from "./schema/transactions";

async function main() {
  const rows = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(5);

  console.log("📊 Latest transactions:");

  for (const tx of rows) {
    console.log("────────────────────────────────");
    console.log("Hash:", tx.hash);
    console.log("Block:", tx.blockNumber.toString());
    console.log("From:", tx.fromAddress);
    console.log("To:", tx.toAddress ?? "Contract Creation");
    console.log("Value (wei):", tx.valueWei);
    console.log("Gas:", tx.gas.toString());
    console.log("Timestamp:", tx.timestamp);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Database error:");
  console.error(error);
  process.exit(1);
});