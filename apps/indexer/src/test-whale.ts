import { getWhaleTransactions } from "db";

async function main() {
  const whales = await getWhaleTransactions(20);

  console.log("\n🐋 Whale transactions:\n");

  for (const whale of whales) {
    console.log("Hash:", whale.hash);
    console.log("Block:", whale.blockNumber.toString());
    console.log("From:", whale.fromAddress);
    console.log("To:", whale.toAddress);
    console.log("Value (wei):", whale.valueWei);
    console.log("Timestamp:", whale.timestamp);
    console.log("---");
  }
}

main().catch((error) => {
  console.error("❌ Whale test failed:");
  console.error(error);
  process.exit(1);
});