import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;

  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";

  fullWidth?: boolean;

  loading?: boolean;
};

// import type { ButtonHTMLAttributes, ReactNode } from "react";

// export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//   children: ReactNode;

//   variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";

//   fullWidth?: boolean;

//   loading?: boolean;
// }
