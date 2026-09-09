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

export function calculateSmartMoneyScore(
  input: SmartMoneyInput,
): SmartMoneyScore {
  const netFlowUsd =
    input.inflowUsd - input.outflowUsd;

  const absNetFlow = Math.abs(netFlowUsd);

  let score = 0;

  // Net flow magnitude
  if (absNetFlow >= 100_000) {
    score += 40;
  } else if (absNetFlow >= 50_000) {
    score += 30;
  } else if (absNetFlow >= 10_000) {
    score += 20;
  } else if (absNetFlow >= 1_000) {
    score += 10;
  }

  // Repeated large transactions
  if (input.largeTransactions >= 2) {
    score += 20;
  }

  // Repeated activity
  if (input.transactions >= 3) {
    score += 10;
  }

  // Positive net flow
  if (netFlowUsd >= 1_000) {
    score += 10;
  }

  return {
    score: Math.min(score, 80),
    netFlowUsd,
  };
}