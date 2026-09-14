import path from "node:path";
import { createUserWhaleAlert } from "db";
import { getActiveEthTrackingConfigs } from "db";
import { getUserSmartMoneyRuleForScore } from "db";
import { getSmartMoneyScoreForWalletWithRule } from "db";
import {
  getMatchingUserTrackingConfigs,
} from "./user-whale-detector.js";

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
  formatEther,
  http,
  parseAbiItem,
} from "viem";
import { mainnet } from "viem/chains";
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

const userTrackingConfigs =
  await getActiveEthTrackingConfigs();
  
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


    const matchingUsers =
      getMatchingUserTrackingConfigs(
        tx.value,
        userTrackingConfigs,
      );

    if (matchingUsers.length > 0) {
      const whaleEvent = createWhaleEvent({
        hash: tx.hash,
        blockNumber: block.number,
        fromAddress: tx.from,
        toAddress: tx.to,
        valueWei: tx.value,
        valueEth: formatEther(tx.value),
        smartMoneyScore: null,
      });

      console.log("\n🐋 WHALE DETECTED!");
      console.log(whaleEvent);

      console.log(
        `👤 Matching users: ${matchingUsers.length}`,
      );

      const userScores = new Map<
        string,
        number | null
      >();

      for (const user of matchingUsers) {
        const rule =
          await getUserSmartMoneyRuleForScore(
            user.userId,
          );

        const smartMoneyScore = rule
          ? await getSmartMoneyScoreForWalletWithRule(
              tx.from,
              rule,
            )
          : null;

        userScores.set(
          user.userId,
          smartMoneyScore,
        );

        console.log(
          `🧠 ${user.userId} Smart Money Score: ${
            smartMoneyScore ?? "N/A"
          }`,
        );

// ==============================
// 🧠 SMART MONEY DEBUG
// ==============================
// User ID: b869ca1e-fd77-418c-bd62-c4f5dfe67c11
// Wallet: 0xa772ec0009c6396c475b47f1d207d36a4601caee
// Rule: {
//   netFlowWeight: 50,
//   largeTransactionsWeight: 25,
//   activityWeight: 15,
//   positiveFlowWeight: 10,
//   netFlowThresholdUsd: 10000,
//   largeTransactionCount: 2,
//   activityCount: 3,
//   positiveFlowThresholdUsd: 1000
// }
// Score: null
// ==============================

        console.log(
          `   - ${user.userId}: ≥ ${user.threshold} ETH`,
        );
      }

      const whaleAlertId =
        await notifyWhale(whaleEvent);

      if (whaleAlertId) {
        for (const user of matchingUsers) {
          await createUserWhaleAlert({
            userId: user.userId,
            whaleAlertId,
            smartMoneyScore:
              userScores.get(user.userId) ?? null,
          });
        }

        console.log(
          `📌 Created ${matchingUsers.length} user whale alerts`,
        );
      }
    }

  }
  

  // 2. Get all ERC-20 Transfer logs from this block
  console.log(
    `\n🔎 Fetching ERC-20 Transfer logs for block ${block.number}...\n`,
  );

  const logs = await client.getLogs({
    address: undefined,
    event: transferEvent,
    fromBlock: block.number,
    toBlock: block.number,
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