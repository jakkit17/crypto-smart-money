import { eq, isNull, asc } from "drizzle-orm";

import { db } from "./client.js";
import { userWhaleAlerts } from "./schema/user-whale-alerts.js";

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

export async function getPendingUserWhaleAlerts(
  limit = 100,
) {
  return db
    .select()
    .from(userWhaleAlerts)
    .where(isNull(userWhaleAlerts.sentAt))
    .orderBy(asc(userWhaleAlerts.createdAt))
    .limit(limit);
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