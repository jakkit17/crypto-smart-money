import { config } from "dotenv";

config({
  path: "../../.env",
});

import { getPendingUserWhaleAlerts } from "db";

async function main() {
  const alerts =
    await getPendingUserWhaleAlerts(100);

  console.log(
    `🐋 Pending user whale alerts: ${alerts.length}`,
  );

  for (const alert of alerts) {
    console.log({
      userWhaleAlertId:
        alert.userWhaleAlertId,
      userId: alert.userId,
      whaleAlertId: alert.whaleAlertId,
      valueEth: alert.valueEth,
      fromAddress: alert.fromAddress,
      toAddress: alert.toAddress,
      smartMoneyScore:
        alert.smartMoneyScore,
      chatId: alert.chatId
        ? "CONFIGURED"
        : null,
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});