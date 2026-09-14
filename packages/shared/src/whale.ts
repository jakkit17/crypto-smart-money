export type WhaleEvent = {
  chain: "ethereum";
  hash: string;
  blockNumber: bigint;
  fromAddress: string;
  toAddress: string | null;
  valueWei: bigint;
  valueEth: string;
};