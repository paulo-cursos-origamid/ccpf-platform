export interface BackendGeneratorContract {
  generate(options: BackendGeneratorOptions): Promise<void>;
}

export interface BackendGeneratorOptions {
  projectName: string;
  destination?: string;
}
