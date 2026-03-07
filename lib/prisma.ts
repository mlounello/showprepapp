import { PrismaClient } from "@prisma/client";
import { applySchemaToPostgresUrl, resolveAppSchema } from "@/lib/app-schema";

declare global {
  var prisma: PrismaClient | undefined;
}

function normalizePrismaSchemaUrls() {
  const schema = resolveAppSchema();
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = applySchemaToPostgresUrl(process.env.DATABASE_URL, schema);
  }
  if (process.env.DIRECT_URL) {
    process.env.DIRECT_URL = applySchemaToPostgresUrl(process.env.DIRECT_URL, schema);
  }

  if (process.env.DEBUG_DATA === "true") {
    console.info(`[DATA DEBUG] prisma schema resolved: ${schema}`);
  }
}

normalizePrismaSchemaUrls();

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
