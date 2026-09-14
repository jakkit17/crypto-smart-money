import { sendTelegramAlert } from "./telegram.js";

async function main() {
  await sendTelegramAlert(
    [
      "🐋 TEST WHALE ALERT",
      "",
      "💰 Value: 42 ETH",
      "🌐 Ethereum Mainnet",
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error("❌ Telegram test failed:");
  console.error(error);
  process.exit(1);
});