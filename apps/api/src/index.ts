import Fastify from "fastify";
import { registerHttpLogger } from "./plugins/http-logger.js";
import { getWhaleTransactions } from "db";

import { smartMoneyRoutes } from "./routes/smart-money.js";
import { usersRoutes } from "./routes/users.js";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

app.get("/api/whales", async () => {
  // console.log("🐋 /api/whales: start");

  const whales = await getWhaleTransactions(20);

  // console.log("🐋 /api/whales: query done");
  // console.log("🐋 count:", whales.length);

  return {
    data: whales.map((whale) => ({
      ...whale,
      blockNumber: whale.blockNumber.toString(),
    })),
  };
});

const start = async () => {
  try {
    await registerHttpLogger(app);
    await smartMoneyRoutes(app);
    await usersRoutes(app);

    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    console.log("🚀 API server started on port 3000");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();