import { AppLayout } from "@/components/layout/AppLayout";
import "@/styles/globals.scss";

export const metadata = {
  title: "CCPF",
  description: "Centro de Controle Pessoal Financeiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
