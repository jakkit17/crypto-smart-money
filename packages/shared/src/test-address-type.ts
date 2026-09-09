import { classifyAddressType } from "./address-type.js";

const tests = [
  {
    name: "EOA",
    code: undefined,
  },
  {
    name: "EOA empty",
    code: "0x",
  },
  {
    name: "Contract",
    code: "0x6001600055",
  },
];

for (const test of tests) {
  console.log(
    `${test.name}: ${classifyAddressType(test.code)}`,
  );
}