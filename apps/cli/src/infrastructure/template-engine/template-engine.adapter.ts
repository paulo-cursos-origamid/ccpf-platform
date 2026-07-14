import Handlebars from 'handlebars';
import type { TemplateEngineContract } from '../../core/contracts/template-engine.contract.js';


export class TemplateEngineAdapter implements TemplateEngineContract {
  render(
    template: string,
    data: Record<string, unknown>,
  ): string {
    const compiledTemplate = Handlebars.compile(template);

    return compiledTemplate(data);
  }
}