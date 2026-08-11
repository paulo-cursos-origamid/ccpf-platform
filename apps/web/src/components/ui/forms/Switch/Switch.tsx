import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./Switch.module.scss";

export interface SwitchProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label?: string;
}

export function Switch({
  className,
  label,
  id,
  ...props
}: SwitchProps) {
  const switchId = id ?? props.name;

  return (
    <label
      className={cn(styles.wrapper, className)}
      htmlFor={switchId}
    >
      <input
        {...props}
        id={switchId}
        type="checkbox"
        role="switch"
        className={styles.input}
      />

      <span
        className={styles.control}
        aria-hidden="true"
      >
        <span className={styles.thumb} />
      </span>

      {label && (
        <span className={styles.label}>
          {label}
        </span>
      )}
    </label>
  );
}