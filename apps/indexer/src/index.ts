import path from "node:path";
import { config } from "dotenv";
import {
  createPublicClient,
  decodeEventLog,
  formatEther,
  http,
  parseAbiItem,
} from "viem";
import { mainnet } from "viem/chains";
import {
  db,
  transactions,
  tokenTransfers,
  tokens,
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

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const erc20MetadataAbi = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

// Function to save token metadata to the database
// -----------------------------------------------------------------

async function saveTokenMetadata(tokenAddress: `0x${string}`) {
  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: erc20MetadataAbi,
        functionName: "name",
      }),

      client.readContract({
        address: tokenAddress,
        abi: erc20MetadataAbi,
        functionName: "symbol",
      }),

      client.readContract({
        address: tokenAddress,
        abi: erc20MetadataAbi,
        functionName: "decimals",
      }),
    ]);

    await db
      .insert(tokens)
      .values({
        chain: "ethereum",
        address: tokenAddress,
        name,
        symbol,
        decimals,
      })
      .onConflictDoNothing({
        target: [
          tokens.chain,
          tokens.address,
        ],
      });

    console.log("🏷️ Token metadata saved:");
    console.log("   Address:", tokenAddress);
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals);
  } catch (error) {
    console.log(
      "⚠️ Failed to read token metadata:",
      tokenAddress,
    );
  }
}

// Main function to index the latest block and save transactions and token transfers
// ---------------------------------------------------------------------------------------

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

    const receipt = await client.getTransactionReceipt({
      hash: tx.hash,
    });

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: [transferEvent],
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName !== "Transfer") {
          continue;
        }

        await saveTokenMetadata(
          log.address as `0x${string}`,
        );
        
        await db
          .insert(tokenTransfers)
          .values({
            chain: "ethereum",
            transactionHash: tx.hash,
            logIndex: log.logIndex,
            blockNumber: block.number,
            tokenAddress: log.address,
            fromAddress: decoded.args.from,
            toAddress: decoded.args.to,
            amountRaw: decoded.args.value.toString(),
            timestamp: blockTimestamp,
          })
          .onConflictDoNothing({
            target: [
              tokenTransfers.transactionHash,
              tokenTransfers.logIndex,
            ],
          });

        console.log("🪙 Token transfer saved:");
        console.log("   Token:", log.address);
        console.log("   From:", decoded.args.from);
        console.log("   To:", decoded.args.to);
        console.log("   Amount:", decoded.args.value.toString());
      } catch {
        // Ignore logs that are not ERC-20 Transfer events
      }
    }
  }
}

main().catch((error) => {
  console.error("❌ Indexer error:");
  console.error(error);
  process.exit(1);
});