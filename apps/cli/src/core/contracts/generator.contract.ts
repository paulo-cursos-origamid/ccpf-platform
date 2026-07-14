import  type{ BlueprintModel } from '../models/blueprint.model.js';

export interface GeneratorContract {
  generate(
    blueprint: BlueprintModel,
  ): Promise<void>;
}
