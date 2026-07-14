import { pascalCase } from "./pascal-case.helper.js";

export function camelCase(value: string): string {
  const result = pascalCase(value);

  return (
    result.charAt(0).toLowerCase() +
    result.slice(1)
  );
}