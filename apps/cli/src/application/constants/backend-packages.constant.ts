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
  "prisma@6.14.0",
  "@prisma/client@6.14.0",
] as const;

export const BACKEND_DEV_DEPENDENCIES = [
  "@types/cookie-parser",
  "@types/compression",
] as const;
