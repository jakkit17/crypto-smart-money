import { gte, desc } from "drizzle-orm";
import { db } from "./client.js";
import { transactions } from "./schema/transactions.js";

const WHALE_THRESHOLD_WEI =
  "10000000000000000000"; // 10 ETH

export async function getWhaleTransactions(
  limit = 20,
) {
  return db
    .select({
      hash: transactions.hash,
      blockNumber: transactions.blockNumber,
      fromAddress: transactions.fromAddress,
      toAddress: transactions.toAddress,
      valueWei: transactions.valueWei,
      timestamp: transactions.timestamp,
    })
    .from(transactions)
    .where(
      gte(
        transactions.valueWei,
        WHALE_THRESHOLD_WEI,
      ),
    )
    .orderBy(desc(transactions.valueWei))
    .limit(limit);
}