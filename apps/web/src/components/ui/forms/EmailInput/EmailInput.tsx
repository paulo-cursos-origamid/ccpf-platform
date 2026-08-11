import { Mail } from "lucide-react";

import { Input } from "../Input";

import type { EmailInputProps } from "./EmailInput.types";

export function EmailInput({ ...props }: EmailInputProps) {
  return (
    <Input
      {...props}
      type="email"
      leftIcon={<Mail size={18} strokeWidth={1.8} />}
    />
  );
}
