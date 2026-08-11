import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./Radio.module.scss";

export interface RadioProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label?: string;
}

export function Radio({
  className,
  label,
  id,
  ...props
}: RadioProps) {
  const radioId = id ?? props.name;

  return (
    <label
      className={cn(styles.wrapper, className)}
      htmlFor={radioId}
    >
      <input
        {...props}
        id={radioId}
        type="radio"
        className={styles.input}
      />

      <span
        className={styles.control}
        aria-hidden="true"
      />

      {label && (
        <span className={styles.label}>
          {label}
        </span>
      )}
    </label>
  );
}