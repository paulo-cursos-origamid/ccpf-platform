"use client";

import { useState, type ChangeEvent } from "react";

import { Input } from "../Input";

import type { CurrencyInputProps } from "./CurrencyInput.types";

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return formatter.format(value);
}

function parseCurrency(value: string): number | null {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return Number(digits) / 100;
}

export function CurrencyInput({
  value,
  defaultValue,
  onChange,
  ...props
}: CurrencyInputProps) {
  const [internalValue, setInternalValue] = useState<number | null>(
    value ?? defaultValue ?? null,
  );

  const currentValue = value !== undefined ? value : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const numericValue = parseCurrency(event.target.value);

    if (value === undefined) {
      setInternalValue(numericValue);
    }

    onChange?.(numericValue);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatCurrency(currentValue)}
      onChange={handleChange}
    />
  );
}
