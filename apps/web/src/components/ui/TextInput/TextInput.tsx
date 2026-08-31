import type { InputHTMLAttributes, ReactNode } from "react";

import { Input } from "../forms";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function TextInput({
  leftIcon,
  rightIcon,
  ...props
}: TextInputProps) {
  return (
    <Input
      {...props}
      type="text"
      leftIcon={leftIcon}
      rightIcon={rightIcon}
    />
  );
}
