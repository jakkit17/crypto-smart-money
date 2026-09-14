import { asc, eq, isNull } from "drizzle-orm";
import { db } from "./client.js";
import { whaleAlerts } from "./schema/whale-alerts.js";

export async function enqueueWhaleAlert(event: {
  chain: "ethereum";
  hash: string;
  blockNumber: bigint;
  fromAddress: string;
  toAddress: string | null;
  valueWei: bigint;
  valueEth: string;
  smartMoneyScore?: number | null;
}) {
  await db
    .insert(whaleAlerts)
    .values({
      chain: event.chain,
      hash: event.hash,
      blockNumber: event.blockNumber,
      fromAddress: event.fromAddress,
      toAddress: event.toAddress,
      valueWei: event.valueWei.toString(),
      valueEth: event.valueEth,
      smartMoneyScore: event.smartMoneyScore?.toString() ?? null,
    })
    .onConflictDoNothing({
      target: whaleAlerts.hash,
    });
}

export async function getPendingWhaleAlerts(limit = 100) {
  return db
    .select()
    .from(whaleAlerts)
    .where(isNull(whaleAlerts.sentAt))
    .orderBy(asc(whaleAlerts.createdAt))
    .limit(limit);
}

export async function markWhaleAlertsSent(
  ids: string[],
) {
  for (const id of ids) {
    await db
      .update(whaleAlerts)
      .set({
        sentAt: new Date(),
      })
      .where(eq(whaleAlerts.id, id));
  }
}