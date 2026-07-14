export interface TemplateEngineContract {
  render(
    template: string,
    data: Record<string, unknown>,
  ): string;
}