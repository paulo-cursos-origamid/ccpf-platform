import { cn } from "@/lib/utils";

import type { ButtonProps } from "./Button.types";

import styles from "./Button.module.scss";

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
}
