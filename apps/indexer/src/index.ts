import path from "node:path";
import { config } from "dotenv";
import {
  createPublicClient,
  http,
} from "viem";
import { mainnet } from "viem/chains";

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
  });

  console.log("🧱 Block hash:", block.hash);
  console.log("⏱️ Timestamp:", block.timestamp);
  console.log("⛽ Gas limit:", block.gasLimit.toString());
  console.log("🔢 Transactions:", block.transactions.length);
}

main().catch((error) => {
  console.error("❌ Indexer error:");
  console.error(error);
  process.exit(1);
});