import { isWhaleTransaction } from "./whale-detector.js";

const tests = [
  {
    value: 5n * 10n ** 18n,
    expected: false,
  },
  {
    value: 10n * 10n ** 18n,
    expected: true,
  },
  {
    value: 20n * 10n ** 18n,
    expected: true,
  },
];

for (const test of tests) {
  const result = isWhaleTransaction(test.value);

  console.log(
    `${test.value} → ${result} ${
      result === test.expected ? "✅" : "❌"
    }`,
  );
}

console.log("\n🐋 Whale detector test complete");