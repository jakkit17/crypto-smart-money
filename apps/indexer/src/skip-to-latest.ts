import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { setLastProcessedBlock } from "db";

config({
  path: "../../.env",
});

const RPC_URL = process.env.ETHEREUM_RPC_URL;

if (!RPC_URL) {
  throw new Error("ETHEREUM_RPC_URL is not set");
}

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
});

export async function skipToLatestBlock() {
  const latestBlock = await client.getBlockNumber();

  await setLastProcessedBlock(latestBlock);

  return {
    latestBlock,
  };
}