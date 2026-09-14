import { config } from "dotenv";

config({
  path: "../../.env",
});

const WHALE_THRESHOLD_ETH =
  process.env.WHALE_THRESHOLD_ETH ?? "10";

const WHALE_THRESHOLD_WEI =
  BigInt(WHALE_THRESHOLD_ETH) * 10n ** 18n;
  
export function isWhaleTransaction(valueWei: bigint): boolean {
  return valueWei >= WHALE_THRESHOLD_WEI;
}