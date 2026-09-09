import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { db, tokenTransfers } from "./index.js";
import { sql } from "drizzle-orm";

config({
  path: "../../.env",
});

const rpcUrl = process.env.ETHEREUM_RPC_URL;

if (!rpcUrl) {
  throw new Error("ETHEREUM_RPC_URL is not set");
}

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

async function main() {
  const rows = await db
    .select({
      address: sql<string>`
        distinct lower(
          unnest(
            array[
              ${tokenTransfers.fromAddress},
              ${tokenTransfers.toAddress}
            ]
          )
        )
      `,
    })
    .from(tokenTransfers);

  const addresses = [
    ...new Set(
      rows.map((row) => row.address.toLowerCase()),
    ),
  ];

  console.log("🔍 Address classification");
  console.log("────────────────────────────────");

  for (const address of addresses) {
    const code = await client.getCode({
      address: address as `0x${string}`,
    });

    const type = !code || code === "0x"
      ? "EOA"
      : "CONTRACT";

    console.log(`${type.padEnd(10)} ${address}`);
  }

  console.log("────────────────────────────────");
  console.log(`Addresses: ${addresses.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});