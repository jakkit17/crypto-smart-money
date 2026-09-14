import { config } from "dotenv";
import { db } from "db";
import { whaleAlerts } from "db";

config({ path: "../../.env" });

async function main() {
  const alerts = await db
    .select()
    .from(whaleAlerts)
    .limit(10);

  console.log("🐋 Whale alerts in database:");
  console.log(alerts);

  console.log(`\n📊 Total: ${alerts.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});