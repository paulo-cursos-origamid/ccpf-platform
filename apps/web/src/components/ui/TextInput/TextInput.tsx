import type { InputHTMLAttributes } from "react";

import styles from "./TextInput.module.scss";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      className={`${styles.input} ${className ?? ""}`}
      {...props}
    />
  );
}
