import type { GeneratedFileModel } from './generated-file.model.js';

export interface BlueprintModel {
  platform: string;
  
  name: string;

  type: string;

  destination: string;

  files: GeneratedFileModel[];
}