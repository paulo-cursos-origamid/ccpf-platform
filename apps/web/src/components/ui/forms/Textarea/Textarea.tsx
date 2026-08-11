import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./Textarea.module.scss";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
}

export function Textarea({
  className,
  fullWidth = true,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        styles.textarea,
        fullWidth && styles.fullWidth,
        className,
      )}
      {...props}
    />
  );
}