import "dotenv/config";

import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const port = env.PORT;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

