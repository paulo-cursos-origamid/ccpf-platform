import type { LabelProps } from "./Label.types";

import { cn } from "@/lib/utils";

import styles from "./Label.module.scss";

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label className={cn(styles.label, className)} {...props}>
      {children}
    </label>
  );
}
