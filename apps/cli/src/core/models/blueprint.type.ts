// src/core/models/blueprint.type.ts

import type { BlueprintModel } from "./blueprint.model.js";
import type { CompositeBlueprintModel } from "./composite-blueprint.model.js";

export type Blueprint = BlueprintModel | CompositeBlueprintModel;
