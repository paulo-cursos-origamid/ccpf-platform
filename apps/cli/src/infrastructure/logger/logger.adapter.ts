import type { LoggerContract } from "../../core/contracts/logger.contract.js";

export class LoggerAdapter implements LoggerContract {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  success(message: string): void {
    console.log(`[SUCCESS] ${message}`);
  }

  warning(message: string): void {
    console.warn(`[WARNING] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }
}