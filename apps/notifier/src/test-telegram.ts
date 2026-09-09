import { sendTelegramMessage } from "./telegram.js";

async function main() {
  await sendTelegramMessage(
    "🐋 WhaleRadar test alert\n\nTelegram notifier is working!",
  );

  console.log("✅ Telegram message sent");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});