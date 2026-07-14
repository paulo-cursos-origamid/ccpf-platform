import { promises as fs } from 'node:fs';
import type { FileSystemContract } from '../../core/contracts/file-system.contract.js';



export class FileSystemAdapter implements FileSystemContract {

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async createDirectory(path: string): Promise<void> {
    await fs.mkdir(path, { recursive: true });
  }

  async removeDirectory(path: string): Promise<void> {
    await fs.rm(path, { recursive: true, force: true });
  }

  async readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fs.writeFile(path, content, 'utf8');
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }

  async removeFile(path: string): Promise<void> {
    await fs.rm(path);
  }

  async list(path: string): Promise<string[]> {
    return fs.readdir(path);
  }

}
