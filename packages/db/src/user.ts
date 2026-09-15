import { eq, and } from "drizzle-orm";
import { db } from "./client.js";
import { users } from "./schema/users.js";

import {
  userTrackingConfigs,
  userSmartMoneyRules,
  notificationConfigs,
} from "./index.js";

export async function createUser(input: {
  email: string;
  name?: string | null;
  timezone?: string;
  authUserId?: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name ?? "",
      timezone: input.timezone ?? "UTC",
      authUserId: input.authUserId ?? null,
    })
    .returning();

  return user;
}

export async function getUserById(
  userId: string,
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function getUserSettings(
  userId: string,
) {
  const [tracking] = await db
    .select()
    .from(userTrackingConfigs)
    .where(
      eq(
        userTrackingConfigs.userId,
        userId,
      ),
    )
    .limit(1);

  const [smartMoneyRule] = await db
    .select()
    .from(userSmartMoneyRules)
    .where(
      eq(
        userSmartMoneyRules.userId,
        userId,
      ),
    )
    .limit(1);

  const [notification] = await db
    .select()
    .from(notificationConfigs)
    .where(
      eq(
        notificationConfigs.userId,
        userId,
      ),
    )
    .limit(1);

  return {
    tracking: tracking ?? null,
    smartMoneyRule:
      smartMoneyRule ?? null,
    notification:
      notification ?? null,
  };
}

export async function upsertUserTrackingConfig(input: {
  userId: string;
  chain: "ethereum";
  assetType: "native";
  assetSymbol: "ETH";
  threshold: string;
  enabled?: boolean;
}) {
  const [config] = await db
    .insert(userTrackingConfigs)
    .values({
      userId: input.userId,
      chain: input.chain,
      assetType: input.assetType,
      assetSymbol: input.assetSymbol,
      threshold: input.threshold,
      enabled: input.enabled ?? true,
    })
    .onConflictDoUpdate({
      target: [
        userTrackingConfigs.userId,
        userTrackingConfigs.chain,
        userTrackingConfigs.assetType,
        userTrackingConfigs.assetSymbol,
      ],
      set: {
        threshold: input.threshold,
        enabled: input.enabled ?? true,
        updatedAt: new Date(),
      },
    })
    .returning();

  return config;
}

export async function upsertUserSmartMoneyRule(input: {
  userId: string;
  netFlowWeight?: number;
  largeTransactionsWeight?: number;
  activityWeight?: number;
  positiveFlowWeight?: number;
  netFlowThresholdUsd?: string;
  largeTransactionCount?: number;
  activityCount?: number;
  positiveFlowThresholdUsd?: string;
  enabled?: boolean;
}) {
  const [rule] = await db
    .insert(userSmartMoneyRules)
    .values({
      userId: input.userId,
      netFlowWeight:
        input.netFlowWeight ?? 50,
      largeTransactionsWeight:
        input.largeTransactionsWeight ?? 25,
      activityWeight:
        input.activityWeight ?? 15,
      positiveFlowWeight:
        input.positiveFlowWeight ?? 10,
      netFlowThresholdUsd:
        input.netFlowThresholdUsd ?? "10000",
      largeTransactionCount:
        input.largeTransactionCount ?? 2,
      activityCount:
        input.activityCount ?? 3,
      positiveFlowThresholdUsd:
        input.positiveFlowThresholdUsd ?? "1000",
      enabled:
        input.enabled ?? true,
    })
    .onConflictDoUpdate({
      target: userSmartMoneyRules.userId,
      set: {
        netFlowWeight:
          input.netFlowWeight ?? 50,
        largeTransactionsWeight:
          input.largeTransactionsWeight ?? 25,
        activityWeight:
          input.activityWeight ?? 15,
        positiveFlowWeight:
          input.positiveFlowWeight ?? 10,
        netFlowThresholdUsd:
          input.netFlowThresholdUsd ?? "10000",
        largeTransactionCount:
          input.largeTransactionCount ?? 2,
        activityCount:
          input.activityCount ?? 3,
        positiveFlowThresholdUsd:
          input.positiveFlowThresholdUsd ?? "1000",
        enabled:
          input.enabled ?? true,
        updatedAt: new Date(),
      },
    })
    .returning();

  return rule;
}

export async function upsertTelegramNotification(
  userId: string,
  chatId: string,
  enabled = true,
) {
  const [config] = await db
    .insert(notificationConfigs)
    .values({
      userId,
      channel: "telegram",
      chatId,
      enabled,
    })
    .onConflictDoUpdate({
      target: [
        notificationConfigs.userId,
        notificationConfigs.channel,
      ],
      set: {
        chatId,
        enabled,
        updatedAt: new Date(),
      },
    })
    .returning();

  return config;
}

export async function getActiveEthTrackingConfigs() {
  return db
    .select()
    .from(userTrackingConfigs)
    .where(
      and(
        eq(userTrackingConfigs.chain, "ethereum"),
        eq(userTrackingConfigs.assetType, "native"),
        eq(userTrackingConfigs.assetSymbol, "ETH"),
        eq(userTrackingConfigs.enabled, true),
      ),
    );
}

export async function getUserSmartMoneyRule(
  userId: string,
) {
  const [rule] = await db
    .select()
    .from(userSmartMoneyRules)
    .where(eq(userSmartMoneyRules.userId, userId))
    .limit(1);

  return rule ?? null;
}

export async function getUserSmartMoneyRuleForScore(
  userId: string,
) {
  const rule = await getUserSmartMoneyRule(userId);

  if (!rule || !rule.enabled) {
    return null;
  }

  return {
    netFlowWeight: rule.netFlowWeight,
    largeTransactionsWeight:
      rule.largeTransactionsWeight,
    activityWeight: rule.activityWeight,
    positiveFlowWeight:
      rule.positiveFlowWeight,

    netFlowThresholdUsd:
      Number(rule.netFlowThresholdUsd),

    largeTransactionCount:
      rule.largeTransactionCount,

    activityCount:
      rule.activityCount,

    positiveFlowThresholdUsd:
      Number(rule.positiveFlowThresholdUsd),
  };
}

export async function getTelegramNotificationForUser(
  userId: string,
) {
  const [notification] = await db
    .select()
    .from(notificationConfigs)
    .where(
      and(
        eq(notificationConfigs.userId, userId),
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
    .limit(1);

  return notification ?? null;
}

export async function getUserByAuthUserId(authUserId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  return user ?? null;
}

export async function upsertUserFromAuth(input: {
  authUserId: string;
  email: string;
  name?: string | null;
}) {
  const existing = await getUserByAuthUserId(input.authUserId);

  if (existing) {
    return existing;
  }

  return createUser({
    authUserId: input.authUserId,
    email: input.email,
    name: input.name,
    timezone: "Asia/Bangkok",
  });
}

export async function acceptTermsAndCreateUser(input: {
  authUserId: string;
  email: string;
  name: string;
  termsVersion: string;
}) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(users)
      .where(
        eq(
          users.authUserId,
          input.authUserId,
        ),
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    const [user] = await tx
      .insert(users)
      .values({
        authUserId: input.authUserId,
        email: input.email,
        name: input.name,
        timezone: "Asia/Bangkok",
        termsAcceptedAt: new Date(),
        termsVersion: input.termsVersion,
      })
      .returning();

    return user;
  });
}