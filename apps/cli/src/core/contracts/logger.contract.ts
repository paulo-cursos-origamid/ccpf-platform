export interface LoggerContract {
  info(message: string): void;

  success(message: string): void;

  warning(message: string): void;

  error(message: string): void;

  debug(message: string): void;
}