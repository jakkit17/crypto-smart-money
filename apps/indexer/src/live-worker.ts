import path from "node:path";
import { config } from "dotenv";
import {
  createPublicClient,
  webSocket,
} from "viem";
import { mainnet } from "viem/chains";

import {
  getLastProcessedBlock,
  setLastProcessedBlock,
} from "db";

import { processBlock } from "./index.js";

config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const wsUrl = process.env.ETHEREUM_WS_URL;

if (!wsUrl) {
  throw new Error("ETHEREUM_WS_URL is not set");
}

const client = createPublicClient({
  chain: mainnet,
  transport: webSocket(wsUrl),
});

const blockQueue: bigint[] = [];
let processing = false;

let unwatch: (() => void) | null = null;

async function processQueue() {
  if (processing) {
    return;
  }

  processing = true;

  try {
    while (blockQueue.length > 0) {
      const blockNumber = blockQueue.shift();

      if (blockNumber === undefined) {
        continue;
      }

      console.log(
        `⛓️ Processing queued block: ${blockNumber}`,
      );

      try {
        await processBlock(blockNumber);

        await setLastProcessedBlock(blockNumber);

        console.log(
          `💾 Checkpoint saved: ${blockNumber}`,
        );

        console.log(
          `✅ Live block processed: ${blockNumber}`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to process block ${blockNumber}:`,
        );

        console.error(error);
      }
    }
  } finally {
    processing = false;
  }
}

async function catchUp() {
  console.log("🔄 Checking for missed blocks...");

  const lastProcessedBlock =
    await getLastProcessedBlock();

  const latestBlock =
    await client.getBlockNumber();

  console.log(
    `💾 Last processed block: ${
      lastProcessedBlock?.toString() ?? "none"
    }`,
  );

  console.log(
    `⛓️ Latest Ethereum block: ${latestBlock}`,
  );

  if (lastProcessedBlock === null) {
    console.log(
      "🆕 No checkpoint found. Starting from latest block.",
    );

    await processBlock(latestBlock);

    await setLastProcessedBlock(latestBlock);

    console.log(
      `💾 Checkpoint saved: ${latestBlock}`,
    );

    return;
  }

  if (lastProcessedBlock >= latestBlock) {
    console.log("✅ No missed blocks.");
    return;
  }

  const startBlock =
    lastProcessedBlock + 1n;

  console.log(
    `🔁 Catching up blocks ${startBlock} → ${latestBlock}`,
  );

  for (
    let blockNumber = startBlock;
    blockNumber <= latestBlock;
    blockNumber++
  ) {
    console.log(
      `⛓️ Catch-up processing: ${blockNumber}`,
    );

    await processBlock(blockNumber);

    await setLastProcessedBlock(blockNumber);

    console.log(
      `💾 Checkpoint saved: ${blockNumber}`,
    );
  }

  console.log("✅ Catch-up completed");
}

async function start() {
  console.log("🚀 Ethereum live worker starting...");

  // 1. Catch up first
  await catchUp();

  // 2. Re-check once before opening live mode
  await catchUp();

  // 3. Start WebSocket live mode
  unwatch = client.watchBlocks({
    onBlock(block) {
      if (!block.number) {
        return;
      }

      console.log(
        `📥 New block received: ${block.number}`,
      );

      blockQueue.push(block.number);

      void processQueue();
    },

    onError(error) {
      console.error(
        "❌ WebSocket error:",
        error,
      );
    },
  });

  console.log("🟢 Live worker is listening for new blocks");
}

start().catch((error) => {
  console.error("❌ Live worker error:");
  console.error(error);
  process.exit(1);
});

function shutdown() {
  console.log("🛑 Stopping live worker...");

  unwatch?.();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);