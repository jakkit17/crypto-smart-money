export type SmartMoneyInput = {
  transactions: number;
  largeTransactions: number;
  inflowUsd: number;
  outflowUsd: number;
};

export type SmartMoneyScore = {
  score: number;
  netFlowUsd: number;
};

export type SmartMoneyRule = {
  netFlowWeight: number;
  largeTransactionsWeight: number;
  activityWeight: number;
  positiveFlowWeight: number;

  netFlowThresholdUsd: number;
  largeTransactionCount: number;
  activityCount: number;
  positiveFlowThresholdUsd: number;
};

export function calculateSmartMoneyScore(
  input: SmartMoneyInput,
): SmartMoneyScore {
  const netFlowUsd =
    input.inflowUsd - input.outflowUsd;

  const absNetFlow = Math.abs(netFlowUsd);

  let score = 0;

  // Net flow magnitude — 50 points
  if (absNetFlow >= 100_000) {
    score += 50;
  } else if (absNetFlow >= 50_000) {
    score += 40;
  } else if (absNetFlow >= 10_000) {
    score += 25;
  } else if (absNetFlow >= 1_000) {
    score += 10;
  }

  // Repeated large transactions — 25 points
  if (input.largeTransactions >= 2) {
    score += 25;
  }

  // Repeated activity — 15 points
  if (input.transactions >= 3) {
    score += 15;
  }

  // Positive net flow — 10 points
  if (netFlowUsd >= 1_000) {
    score += 10;
  }

  return {
    score: Math.min(score, 100),
    netFlowUsd,
  };
}

export function calculateSmartMoneyScoreWithRule(
  input: SmartMoneyInput,
  rule: SmartMoneyRule,
): SmartMoneyScore {
  const netFlowUsd =
    input.inflowUsd - input.outflowUsd;

  const absNetFlow = Math.abs(netFlowUsd);

  let score = 0;

  // Net flow magnitude
  if (absNetFlow >= rule.netFlowThresholdUsd) {
    score += rule.netFlowWeight;
  }

  // Repeated large transactions
  if (
    input.largeTransactions >=
    rule.largeTransactionCount
  ) {
    score += rule.largeTransactionsWeight;
  }

  // Repeated activity
  if (
    input.transactions >=
    rule.activityCount
  ) {
    score += rule.activityWeight;
  }

  // Positive net flow
  if (
    netFlowUsd >=
    rule.positiveFlowThresholdUsd
  ) {
    score += rule.positiveFlowWeight;
  }

  return {
    score: Math.min(score, 100),
    netFlowUsd,
  };
}