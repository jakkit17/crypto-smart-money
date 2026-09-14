import { config } from "dotenv";
import {
  createUserWhaleAlert,
  getActiveEthTrackingConfigs,
  getWhaleAlertById,
} from "db";

config({ path: "../../.env" });

const WHALE_ALERT_ID =
  "89cc2409-d4d8-476e-96ca-d98af7edd5c9";

async function main() {
  const users = await getActiveEthTrackingConfigs();
  const whale = await getWhaleAlertById(WHALE_ALERT_ID);

  console.log("👤 Active users:", users.length);
  console.log("🐋 Whale alert:", whale);

  if (users.length === 0) {
    throw new Error("No active user tracking configs found");
  }

  if (!whale) {
    throw new Error("Whale alert not found");
  }

  const user = users[0];

  const result = await createUserWhaleAlert({
    userId: user.userId,
    whaleAlertId: whale.id,
    smartMoneyScore: whale.smartMoneyScore
      ? Number(whale.smartMoneyScore)
      : null,
  });

  console.log("\n✅ User whale alert created:");
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});