import path from "node:path";
import { config } from "dotenv";
import {
  createPublicClient,
  http,
  parseAbiItem,
  decodeEventLog,
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

const txHash =
  "0x9c2c961a71e6a809686b40831e199e8c6c4edb31f96473e3da438b565929c7e1";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

async function main() {
  console.log("🔎 Reading ERC-20 transfers...\n");

  const receipt = await client.getTransactionReceipt({
    hash: txHash,
  });

  for (const [index, log] of receipt.logs.entries()) {
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Transfer") {
        continue;
      }

      console.log(`──────── Transfer ${index} ────────`);
      console.log("Token:", log.address);
      console.log("From:", decoded.args.from);
      console.log("To:", decoded.args.to);
      console.log("Amount:", decoded.args.value.toString());
      console.log();
    } catch {
      // Not an ERC-20 Transfer event
    }
  }
}

main().catch((error) => {
  console.error("❌ Error:");
  console.error(error);
  process.exit(1);
});