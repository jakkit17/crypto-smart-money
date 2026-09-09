export type AddressType = "EOA" | "CONTRACT";

export function classifyAddressType(
  code: string | undefined,
): AddressType {
  return !code || code === "0x"
    ? "EOA"
    : "CONTRACT";
}