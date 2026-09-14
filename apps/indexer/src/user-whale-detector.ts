import { parseEther } from "viem";
import type { UserTrackingConfig } from "db";

export function matchesUserWhaleThreshold(
  valueWei: bigint,
  config: UserTrackingConfig,
): boolean {
  const thresholdWei = parseEther(config.threshold);

  return valueWei >= thresholdWei;
}

export function getMatchingUserTrackingConfigs(
  valueWei: bigint,
  configs: UserTrackingConfig[],
): UserTrackingConfig[] {
  return configs.filter((config) =>
    matchesUserWhaleThreshold(valueWei, config),
  );
}