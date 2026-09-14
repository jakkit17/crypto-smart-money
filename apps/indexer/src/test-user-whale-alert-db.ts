import { config } from "dotenv";

config({
  path: "../../.env",
});

import { db } from "db";
import { userWhaleAlerts } from "db";

async function main() {
  const rows = await db
    .select()
    .from(userWhaleAlerts);

  console.log(
    `🐋 Total user_whale_alerts: ${rows.length}`,
  );

  for (const row of rows) {
    console.log({
      id: row.id,
      userId: row.userId,
      whaleAlertId: row.whaleAlertId,
      smartMoneyScore: row.smartMoneyScore,
      createdAt: row.createdAt,
      sentAt: row.sentAt,
    });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});