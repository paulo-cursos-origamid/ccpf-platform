import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCPF — Centro de Controle Pessoal Financeiro",
  description:
    "Organize suas finanças, contas, transações e espaços em um só lugar.",
};

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return <>{children}</>;
}
