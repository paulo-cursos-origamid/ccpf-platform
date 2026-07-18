export interface PrismaInitializerContract {
  initialize(projectPath: string): Promise<void>;
}
