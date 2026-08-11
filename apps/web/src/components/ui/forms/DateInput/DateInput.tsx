"use client";

import type { ChangeEvent } from "react";

import { Input } from "../Input";

import type { DateInputProps } from "./DateInput.types";

export function DateInput({
  value,
  defaultValue,
  onChange,
  ...props
}: DateInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const date = event.target.value;

    onChange?.(date || null);
  }

  return (
    <Input
      {...props}
      type="date"
      value={value ?? undefined}
      defaultValue={defaultValue ?? undefined}
      onChange={handleChange}
    />
  );
}
