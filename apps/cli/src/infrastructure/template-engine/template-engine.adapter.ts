import Handlebars from "handlebars";

import type { TemplateEngineContract } from "../../core/contracts/template-engine.contract.js";

import {
  camelCase,
  kebabCase,
  pascalCase,
  snakeCase,
} from "./helpers/index.js";

export class TemplateEngineAdapter implements TemplateEngineContract {
  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    Handlebars.registerHelper("pascalCase", (value: string) =>
      pascalCase(value),
    );

    Handlebars.registerHelper("camelCase", (value: string) => camelCase(value));

    Handlebars.registerHelper("kebabCase", (value: string) => kebabCase(value));

    Handlebars.registerHelper("snakeCase", (value: string) => snakeCase(value));
  }

  render(template: string, data: Record<string, unknown>): string {
    const compiledTemplate = Handlebars.compile(template);

    return compiledTemplate(data);
  }
}
