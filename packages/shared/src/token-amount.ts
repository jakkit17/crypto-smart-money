export function formatTokenAmount(
  amountRaw: string,
  decimals: number,
): string {
  const amount = BigInt(amountRaw);

  if (decimals === 0) {
    return amount.toString();
  }

  const divisor = 10n ** BigInt(decimals);

  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return integerPart.toString();
  }

  const fractionalString = fractionalPart
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return `${integerPart}.${fractionalString}`;
}