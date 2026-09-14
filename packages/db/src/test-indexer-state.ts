import {
  getLastProcessedBlock,
  setLastProcessedBlock,
} from "./indexer-state.js";

const before = await getLastProcessedBlock();

console.log(
  "Before:",
  before?.toString() ?? "null",
);

await setLastProcessedBlock(12345678n);

const after = await getLastProcessedBlock();

console.log(
  "After:",
  after?.toString() ?? "null",
);

process.exit(0);