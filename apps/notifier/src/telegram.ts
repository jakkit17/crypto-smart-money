import { config } from "dotenv";

config({
  path: "../../.env",
});

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

if (!chatId) {
  throw new Error("TELEGRAM_CHAT_ID is not set");
}

export async function sendTelegramAlert(
  message: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Telegram API error: ${response.status} ${body}`,
    );
  }

  console.log("📨 Telegram alert sent");
}