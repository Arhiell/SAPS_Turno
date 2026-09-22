import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(
  env.PORT,
  () => {
    console.log("");
    console.log("==================================");
    console.log("🏥 SAPS Turno API");
    console.log("==================================");
    console.log(`🚀 Servidor: http://localhost:${env.PORT}`);
    console.log(`🌎 Entorno: ${env.NODE_ENV}`);
    console.log("==================================");
    console.log("");
  }
);

const shutdown = () => {
  console.log("Cerrando SAPS Turno API...");

  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);