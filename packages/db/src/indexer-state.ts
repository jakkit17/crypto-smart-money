import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { indexerState } from "./schema/indexer-state.js";

const CHAIN = "ethereum";

export async function getLastProcessedBlock(): Promise<bigint | null> {
  const rows = await db
    .select({
      lastProcessedBlock:
        indexerState.lastProcessedBlock,
    })
    .from(indexerState)
    .where(eq(indexerState.chain, CHAIN))
    .limit(1);

  return rows[0]?.lastProcessedBlock ?? null;
}

export async function setLastProcessedBlock(
  blockNumber: bigint,
): Promise<void> {
  await db
    .insert(indexerState)
    .values({
      chain: CHAIN,
      lastProcessedBlock: blockNumber,
    })
    .onConflictDoUpdate({
      target: indexerState.chain,
      set: {
        lastProcessedBlock: blockNumber,
        updatedAt: new Date(),
      },
    });
}

export async function skipToBlock(
  blockNumber: bigint,
): Promise<void> {
  await setLastProcessedBlock(blockNumber);
}