import path from "node:path";

export class BlueprintPathService {
  resolveTemplate(
    platform: string,
    blueprint: string,
    template: string,
  ): string {
    return path.join(
      process.cwd(),
      "src",
      "platform",
      platform,
      "blueprints",
      blueprint,
      template,
    );
  }
}