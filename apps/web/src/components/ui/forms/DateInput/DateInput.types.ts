import type { InputProps } from "../Input";

export type DateInputProps = Omit<
  InputProps,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: string | null;
  defaultValue?: string | null;

  onChange?: (value: string | null) => void;
};
