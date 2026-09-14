import { config } from "dotenv";

config({
  path: "../../.env",
});

import { db } from "db";
import { userWhaleAlerts } from "db";
import { eq } from "drizzle-orm";

const TEST_ID =
  "0b7a56e3-b0a8-4f05-8312-e570c94e2e6b";

async function main() {
  await db
    .update(userWhaleAlerts)
    .set({
      sentAt: null,
    })
    .where(eq(userWhaleAlerts.id, TEST_ID));

  console.log(
    "✅ Reset test user whale alert to pending",
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});