import { and, eq } from "drizzle-orm";
import { db } from "./client.js";
import { tokens } from "./schema/tokens.js";

export async function tokenMetadataExists(
  tokenAddress: string,
): Promise<boolean> {
  const existingToken = await db
    .select({ id: tokens.id })
    .from(tokens)
    .where(
      and(
        eq(tokens.chain, "ethereum"),
        eq(tokens.address, tokenAddress),
      ),
    )
    .limit(1);

  return existingToken.length > 0;
}