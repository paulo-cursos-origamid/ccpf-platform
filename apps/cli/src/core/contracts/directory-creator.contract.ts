export interface DirectoryCreatorContract {
  create(
    projectPath: string,
    directories: string[],
  ): Promise<void>;
}
