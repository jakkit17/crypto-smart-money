import { config } from "dotenv";
config({ path: "../../.env" });

import {
  getUserSmartMoneyRuleForScore,
  getSmartMoneyScoreForWalletWithRule,
  getSmartMoneyWalletActivity,
} from "db";

const userId = "b869ca1e-fd77-418c-bd62-c4f5dfe67c11";
const wallet = "0xa772ec0009c6396c475b47f1d207d36a4601caee";

async function main() {
  console.log("================================");
  console.log("🧠 SMART MONEY WALLET TEST");
  console.log("================================");
  console.log("Wallet:", wallet);

  const rule = await getUserSmartMoneyRuleForScore(userId);

  console.log("\nRule:");
  console.log(rule);

  const activities = await getSmartMoneyWalletActivity();

  const activity = activities.find(
    (item) =>
      item.wallet.toLowerCase() === wallet.toLowerCase(),
  );

  console.log("\nWallet Activity:");
  console.log(activity ?? "NOT FOUND");

  const score = rule
    ? await getSmartMoneyScoreForWalletWithRule(wallet, rule)
    : null;

  console.log("\nSmart Money Score:");
  console.log(score ?? "N/A");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Test failed:");
  console.error(error);
  process.exit(1);
});