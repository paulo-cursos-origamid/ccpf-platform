import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import type { InputProps } from "./Input.types";

import styles from "./Input.module.scss";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error = false,
      fullWidth = true,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          styles.container,
          fullWidth && styles.fullWidth,
          error && styles.error,
        )}
      >
        {leftIcon && (
          <span className={styles.leftIcon}>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          className={cn(styles.input, className)}
          {...props}
        />

        {rightIcon && (
          <span className={styles.rightIcon}>
            {rightIcon}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";