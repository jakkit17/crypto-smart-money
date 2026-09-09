import { calculateSmartMoneyScore } from "./smart-money-score.js";

const result = calculateSmartMoneyScore({
  transactions: 3,
  largeTransactions: 3,
  inflowUsd: 272_577.62,
  outflowUsd: 181_246.89,
});

console.log("🧠 Smart Money Score");
console.log("────────────────────────────────");
console.log(`Score: ${result.score}/100`);
console.log(`Net Flow: $${result.netFlowUsd.toFixed(2)}`);