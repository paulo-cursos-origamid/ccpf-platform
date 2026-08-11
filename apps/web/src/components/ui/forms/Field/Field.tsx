import { cn } from "@/lib/utils";

import { Label } from "../Label";

import type { FieldProps } from "./Field.types";

import styles from "./Field.module.scss";

export function Field({
  label,
  htmlFor,
  helperText,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn(styles.field, className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}

          {required && <span className={styles.required}>*</span>}
        </Label>
      )}

      {children}

      {error ? (
        <span className={styles.error}>{error}</span>
      ) : helperText ? (
        <span className={styles.helper}>{helperText}</span>
      ) : null}
    </div>
  );
}
