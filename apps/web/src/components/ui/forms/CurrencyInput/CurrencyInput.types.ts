import type { InputProps } from "../Input";

export type CurrencyInputProps = Omit<
  InputProps,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: number | null;
  defaultValue?: number | null;

  onChange?: (value: number | null) => void;
};
