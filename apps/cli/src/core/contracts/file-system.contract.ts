export interface FileSystemContract {
  exists(path: string): Promise<boolean>;

  createDirectory(path: string): Promise<void>;

  removeDirectory(path: string): Promise<void>;

  readFile(path: string): Promise<string>;

  writeFile(path: string, content: string): Promise<void>;

  copyFile(source: string, destination: string): Promise<void>;

  removeFile(path: string): Promise<void>;

  list(path: string): Promise<string[]>;
}
