export interface ProjectCleanerContract {
  clean(projectPath: string): Promise<void>;
}
