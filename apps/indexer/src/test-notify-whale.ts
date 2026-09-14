import { notifyWhale } from "./notify-whale.js";
import type { WhaleEvent } from "shared";

const event: WhaleEvent = {
  chain: "ethereum",
  hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  blockNumber: 25973328n,
  fromAddress:
    "0xc29d294b9c254d20ba7e20923f31a8fe91d4faeb",
  toAddress:
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
  valueWei: 42n * 10n ** 18n,
  valueEth: "42",
};

async function main() {
  console.log("📤 Sending test whale event...");

  await notifyWhale(event);

  console.log("✅ Integration test passed");
}

main().catch((error) => {
  console.error("❌ Integration test failed:");
  console.error(error);
  process.exit(1);
});