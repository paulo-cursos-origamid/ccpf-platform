import type { ReactNode } from "react";

export type FieldProps = {
  label?: string;

  htmlFor?: string;

  helperText?: string;

  error?: string;

  required?: boolean;

  children: ReactNode;

  className?: string;
}