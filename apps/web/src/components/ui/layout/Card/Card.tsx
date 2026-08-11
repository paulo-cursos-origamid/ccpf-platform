import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./Card.module.scss";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;

  elevated?: boolean;

  outlined?: boolean;

  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,

  elevated = false,
  outlined = false,
  padding = "md",

  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        styles[`padding${padding.charAt(0).toUpperCase()}${padding.slice(1)}`],
        elevated && styles.elevated,
        outlined && styles.outlined,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}