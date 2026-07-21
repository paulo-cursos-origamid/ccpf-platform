export abstract class TokenProviderContract {
  abstract generate(userId: string, email: string): Promise<string>;
}
