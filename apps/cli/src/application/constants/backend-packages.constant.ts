export const BACKEND_DEPENDENCIES = [
  "@nestjs/config",
  "@nestjs/swagger",
  "swagger-ui-express",
  "class-validator",
  "class-transformer",
  "cookie-parser",
  "helmet",
  "compression",
  "nestjs-pino",
  "pino",
  "pino-pretty",
  "prisma",
  "@prisma/client",
] as const;

export const BACKEND_DEV_DEPENDENCIES = [
  "@types/cookie-parser",
  "@types/compression",
] as const;
