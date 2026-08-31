import type { InputHTMLAttributes } from "react";

import styles from "./TextInput.module.scss";
import { UserRound } from "lucide-react";
import { Input } from "../forms";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ ...props }: TextInputProps) {
  return (
    <Input
      {...props}
      type="text"
      leftIcon={<UserRound size={18} strokeWidth={1.8} />}
    />
  );
}
