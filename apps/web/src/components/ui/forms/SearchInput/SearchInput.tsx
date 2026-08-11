import { Input } from "../Input";

import type { SearchInputProps } from "./SearchInput.types";

export function SearchInput({ ...props }: SearchInputProps) {
  return (
    <Input {...props} type="search" autoComplete="off" inputMode="search" />
  );
}
