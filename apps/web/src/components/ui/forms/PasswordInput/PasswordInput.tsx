"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

import { Input } from "../Input";

import type { PasswordInputProps } from "./PasswordInput.types";

import styles from "./PasswordInput.module.scss";

export function PasswordInput({
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  function handleToggle() {
    setVisible((current) => !current);
  }

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      className={`${styles.input} ${className ?? ""}`}
      leftIcon={
        <LockKeyhole
          size={18}
          strokeWidth={1.8}
        />
      }
      rightIcon={
        <button
          type="button"
          className={styles.toggle}
          onClick={handleToggle}
          aria-label={
            visible
              ? "Ocultar senha"
              : "Mostrar senha"
          }
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff
              size={19}
              strokeWidth={1.8}
            />
          ) : (
            <Eye
              size={19}
              strokeWidth={1.8}
            />
          )}
        </button>
      }
    />
  );
}