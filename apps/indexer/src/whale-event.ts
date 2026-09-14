import type { WhaleEvent } from "shared";

export function createWhaleEvent(params: {
  hash: string;
  blockNumber: bigint;
  fromAddress: string;
  toAddress: string | null;
  valueWei: bigint;
  valueEth: string;
  smartMoneyScore: number | null;
}): WhaleEvent {
  return {
    chain: "ethereum",
    hash: params.hash,
    blockNumber: params.blockNumber,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    valueWei: params.valueWei,
    valueEth: params.valueEth,
    smartMoneyScore: params.smartMoneyScore,
  };
}