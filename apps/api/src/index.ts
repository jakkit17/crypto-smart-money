import Fastify from "fastify";
import { registerHttpLogger } from "./plugins/http-logger.js";
import { smartMoneyRoutes } from "./routes/smart-money.js";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

const start = async () => {
  try {
    await registerHttpLogger(app);
    await smartMoneyRoutes(app);

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