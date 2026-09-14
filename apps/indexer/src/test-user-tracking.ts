import { config } from "dotenv";
import { getActiveEthTrackingConfigs } from "db";

config({ path: "../../.env" });

async function main() {
  const configs = await getActiveEthTrackingConfigs();

  console.log("👤 Active ETH tracking configs:");
  console.log(configs);

  console.log(`\n📊 Total users: ${configs.length}`);

  for (const config of configs) {
    console.log({
      userId: config.userId,
      threshold: config.threshold,
      enabled: config.enabled,
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});