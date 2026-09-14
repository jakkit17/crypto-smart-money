import { parseEther } from "viem";
import { getActiveEthTrackingConfigs } from "db";
import { matchesUserWhaleThreshold } from "./user-whale-detector.js";

async function main() {
  const configs = await getActiveEthTrackingConfigs();

  if (configs.length === 0) {
    throw new Error("No active ETH tracking configs found");
  }

  const config = configs[0];

  const tests = [
    {
      name: "9 ETH",
      valueWei: parseEther("9"),
      expected: false,
    },
    {
      name: "10 ETH",
      valueWei: parseEther("10"),
      expected: true,
    },
    {
      name: "10.5 ETH",
      valueWei: parseEther("10.5"),
      expected: true,
    },
  ];

  for (const test of tests) {
    const result = matchesUserWhaleThreshold(
      test.valueWei,
      config,
    );

    console.log(
      `${test.name}: ${result ? "🐋 MATCH" : "❌ NO MATCH"}`
    );

    if (result !== test.expected) {
      throw new Error(
        `${test.name} expected ${test.expected}, got ${result}`,
      );
    }
  }

  console.log("\n✅ All user whale threshold tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});