import {
  eq,
  isNull,
  asc,
  and,
} from "drizzle-orm";

import { db } from "./client.js";

import { userWhaleAlerts } from "./schema/user-whale-alerts.js";
import { whaleAlerts } from "./schema/whale-alerts.js";
import { notificationConfigs } from "./schema/notification-configs.js";


export async function createUserWhaleAlert(input: {
  userId: string;
  whaleAlertId: string;
  smartMoneyScore?: number | null;
}) {
  const [alert] = await db
    .insert(userWhaleAlerts)
    .values({
      userId: input.userId,
      whaleAlertId: input.whaleAlertId,
      smartMoneyScore:
        input.smartMoneyScore?.toString() ?? null,
    })
    .onConflictDoNothing({
      target: [
        userWhaleAlerts.userId,
        userWhaleAlerts.whaleAlertId,
      ],
    })
    .returning();

  return alert ?? null;
}

export async function markUserWhaleAlertSent(
  id: string,
) {
  await db
    .update(userWhaleAlerts)
    .set({
      sentAt: new Date(),
    })
    .where(eq(userWhaleAlerts.id, id));
}

export async function getPendingUserWhaleAlerts(
  limit = 100,
) {
  return db
    .select({
      userWhaleAlertId:
        userWhaleAlerts.id,

      userId:
        userWhaleAlerts.userId,

      whaleAlertId:
        userWhaleAlerts.whaleAlertId,

      smartMoneyScore:
        userWhaleAlerts.smartMoneyScore,

      createdAt:
        userWhaleAlerts.createdAt,

      hash:
        whaleAlerts.hash,

      blockNumber:
        whaleAlerts.blockNumber,

      fromAddress:
        whaleAlerts.fromAddress,

      toAddress:
        whaleAlerts.toAddress,

      valueEth:
        whaleAlerts.valueEth,

      chatId:
        notificationConfigs.chatId,
    })
    .from(userWhaleAlerts)
    .innerJoin(
      whaleAlerts,
      eq(
        userWhaleAlerts.whaleAlertId,
        whaleAlerts.id,
      ),
    )
    .innerJoin(
      notificationConfigs,
      eq(
        userWhaleAlerts.userId,
        notificationConfigs.userId,
      ),
    )
    .where(
      and(
        isNull(userWhaleAlerts.sentAt),
        eq(
          notificationConfigs.channel,
          "telegram",
        ),
        eq(
          notificationConfigs.enabled,
          true,
        ),
      ),
    )
    .orderBy(
      asc(userWhaleAlerts.createdAt),
    )
    .limit(limit);
}