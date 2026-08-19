import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./Table.module.scss";

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface TableSectionProps extends TableHTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

function TableHeader({ children, className, ...props }: TableSectionProps) {
  return (
    <thead className={cn(styles.header, className)} {...props}>
      {children}
    </thead>
  );
}

function TableBody({ children, className, ...props }: TableSectionProps) {
  return (
    <tbody className={cn(styles.body, className)} {...props}>
      {children}
    </tbody>
  );
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div className={cn(styles.wrapper, className)} {...props}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

Table.Header = TableHeader;
Table.Body = TableBody;
