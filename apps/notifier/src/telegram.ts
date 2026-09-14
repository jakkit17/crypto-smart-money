import { config } from "dotenv";

config({
  path: "../../.env",
});

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

export async function sendTelegramAlert(
  chatIdOrMessage: string,
  message?: string,
): Promise<void> {
  const chatId =
    message === undefined
      ? process.env.TELEGRAM_CHAT_ID
      : chatIdOrMessage;

  const text =
    message === undefined
      ? chatIdOrMessage
      : message;

  if (!chatId) {
    throw new Error(
      "Telegram chat ID is not configured",
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
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