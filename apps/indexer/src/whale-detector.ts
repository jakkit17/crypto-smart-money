const WHALE_THRESHOLD_WEI = 10n * 10n ** 18n;

export function isWhaleTransaction(valueWei: bigint): boolean {
  return valueWei >= WHALE_THRESHOLD_WEI;
}