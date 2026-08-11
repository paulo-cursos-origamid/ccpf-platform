import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./Select.module.scss";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean;
}

export function Select({
  className,
  fullWidth = true,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(styles.select, fullWidth && styles.fullWidth, className)}
      {...props}
    >
      {children}
    </select>
  );
}
