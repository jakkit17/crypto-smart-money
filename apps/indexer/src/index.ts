import path from "node:path";

import {
  db,
  transactions,
  tokenTransfers,
  tokens,
  tokenMetadataExists,
} from "db";

import { config } from "dotenv";
import {
  createPublicClient,
  decodeEventLog,
  formatEther,
  http,
  parseAbiItem,
} from "viem";
import { mainnet } from "viem/chains";
import { isWhaleTransaction } from "./whale-detector.js";
import { createWhaleEvent } from "./whale-event.js";
import { notifyWhale } from "./notify-whale.js";

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

const tokenMetadataCache = new Set<string>();

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

async function saveTokenMetadata(
  tokenAddress: `0x${string}`,
) {
  const normalizedAddress = tokenAddress.toLowerCase();

  if (tokenMetadataCache.has(normalizedAddress)) {
    console.log(
      `⚡ Token metadata cache hit: ${normalizedAddress}`,
    );
    return;
  }

  const exists =
    await tokenMetadataExists(tokenAddress);

  if (exists) {
    console.log(
      "♻️ Token metadata already exists:",
      tokenAddress,
    );

    tokenMetadataCache.add(normalizedAddress);

    return;
  }

  try {
    const [name, symbol, decimals] =
      await Promise.all([
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

    tokenMetadataCache.add(normalizedAddress);

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

export async function processBlock(blockNumber: bigint) {
  console.log("📦 Processing block:", blockNumber);

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

  console.log(
    `\n📋 Saving ${block.transactions.length} transactions...\n`,
  );

  // 1. Save all transactions
  for (const tx of block.transactions) {
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
    console.log(
      "   To:",
      tx.to ?? "Contract Creation",
    );
    console.log(
      "   Value:",
      formatEther(tx.value),
      "ETH",
    );

    if (isWhaleTransaction(tx.value)) {
      const whaleEvent = createWhaleEvent({
        hash: tx.hash,
        blockNumber: block.number,
        fromAddress: tx.from,
        toAddress: tx.to,
        valueWei: tx.value,
        valueEth: formatEther(tx.value),
      });

      console.log("\n🐋 WHALE DETECTED!");
      console.log(whaleEvent);

      await notifyWhale(whaleEvent);
    }
  }

  // 2. Get all ERC-20 Transfer logs from this block
  console.log(
    `\n🔎 Fetching ERC-20 Transfer logs for block ${blockNumber}...\n`,
  );

  const logs = await client.getLogs({
    address: undefined,
    event: transferEvent,
    fromBlock: blockNumber,
    toBlock: blockNumber,
  });

  const tokenAddresses = new Set<string>();

  for (const log of logs) {
    tokenAddresses.add(log.address.toLowerCase());
  }

  console.log(
    `🪙 Unique token contracts: ${tokenAddresses.size}`,
  );

  for (const tokenAddress of tokenAddresses) {
    await saveTokenMetadata(
      tokenAddress as `0x${string}`,
    );
  }

  console.log(
    `🪙 Found ${logs.length} Transfer logs`,
  );

  // 3. Save token transfers
  for (const log of logs) {
    try {
      if (
        !log.transactionHash ||
        log.args.from === undefined ||
        log.args.to === undefined ||
        log.args.value === undefined
      ) {
        continue;
      }

      const tokenAddress = log.address;

      // await saveTokenMetadata(tokenAddress);

      await db
        .insert(tokenTransfers)
        .values({
          chain: "ethereum",
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          blockNumber: block.number,
          tokenAddress,
          fromAddress: log.args.from,
          toAddress: log.args.to,
          amountRaw: log.args.value.toString(),
          timestamp: blockTimestamp,
        })
        .onConflictDoNothing({
          target: [
            tokenTransfers.transactionHash,
            tokenTransfers.logIndex,
          ],
        });

      console.log("🪙 Token transfer saved:");
      console.log("   Token:", tokenAddress);
      console.log("   Tx:", log.transactionHash);
      console.log("   From:", log.args.from);
      console.log("   To:", log.args.to);
      console.log(
        "   Amount:",
        log.args.value.toString(),
      );
    } catch (error) {
      console.error(
        "❌ Failed to save token transfer:",
      );
      console.error(error);
    }
  }

  console.log(
    `✅ Block ${blockNumber} processed`,
  );
}

async function main() {
  console.log("🚀 Ethereum indexer started");

  const blockNumber =
    await client.getBlockNumber();

  console.log(
    "📦 Latest block:",
    blockNumber,
  );

  await processBlock(blockNumber);
}

if (process.argv[1]?.endsWith("index.ts")) {
  main().catch((error) => {
    console.error("❌ Indexer error:");
    console.error(error);
    process.exit(1);
  });
}