import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./Checkbox.module.scss";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name;

  return (
    <label className={cn(styles.wrapper, className)} htmlFor={checkboxId}>
      <input
        {...props}
        id={checkboxId}
        type="checkbox"
        className={styles.input}
      />

      <span className={styles.control} aria-hidden="true" />

      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
