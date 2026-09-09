import { formatTokenAmount } from "./token-amount.js";

console.log(
  "USDC:",
  formatTokenAmount("398222380000", 6),
);

console.log(
  "WETH:",
  formatTokenAmount("27237366955507712", 18),
);

console.log(
  "SALT:",
  formatTokenAmount("198761602048", 8),
);

console.log(
  "CEL:",
  formatTokenAmount("172316434", 4),
);

console.log(
  "AZTEC:",
  formatTokenAmount("32379000000000000000000", 18),
);