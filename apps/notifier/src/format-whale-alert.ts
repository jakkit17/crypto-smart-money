import type { WhaleEvent } from "shared";

export function formatWhaleAlert(event: WhaleEvent): string {
  return [
    "🐋 WHALE ALERT",
    "",
    `💰 Value: ${event.valueEth} ETH`,
    `🔗 Tx: ${event.hash}`,
    `📦 Block: ${event.blockNumber.toString()}`,
    `📤 From: ${event.fromAddress}`,
    `📥 To: ${event.toAddress ?? "Contract Creation"}`,
    "",
    "🌐 Ethereum Mainnet",
  ].join("\n");
}