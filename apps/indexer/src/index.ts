import path from "node:path";
import { config } from "dotenv";
import {
  createPublicClient,
  formatEther,
  http,
} from "viem";
import { mainnet } from "viem/chains";
import {
  db,
  transactions,
} from "db";

config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const rpcUrl = process.env.ETHEREUM_RPC_URL;

if (!rpcUrl) {
  throw new Error("ETHEREUM_RPC_URL is not set");
}

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

async function main() {
  console.log("🚀 Ethereum indexer started");

  const blockNumber = await client.getBlockNumber();

  console.log("📦 Latest block:", blockNumber);

  const block = await client.getBlock({
    blockNumber,
    includeTransactions: true,
  });

  const blockTimestamp = new Date(
    Number(block.timestamp) * 1000,
  );

  console.log("🧱 Block hash:", block.hash);
  console.log("⏱️ Timestamp:", block.timestamp);
  console.log("⛽ Gas limit:", block.gasLimit.toString());
  console.log("🔢 Transactions:", block.transactions.length);

  console.log("\n📋 Saving first 5 transactions...\n");

  for (const tx of block.transactions.slice(0, 5)) {
    await db
      .insert(transactions)
      .values({
        chain: "ethereum",
        hash: tx.hash,
        blockNumber: block.number,
        blockHash: block.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        valueWei: tx.value.toString(),
        gas: tx.gas,
        gasPriceWei: tx.gasPrice?.toString(),
        transactionIndex: tx.transactionIndex ?? null,
        timestamp: blockTimestamp,
      })
      .onConflictDoNothing({
        target: transactions.hash,
      });

    console.log("💾 Saved:", tx.hash);
    console.log("   From:", tx.from);
    console.log("   To:", tx.to ?? "Contract Creation");
    console.log("   Value:", formatEther(tx.value), "ETH");
  }
}

main().catch((error) => {
  console.error("❌ Indexer error:");
  console.error(error);
  process.exit(1);
});