import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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

  <ThemeProvider>

    <AppLayout>
      {children}
    </AppLayout>

  </ThemeProvider>

</body>
    </html>
  );
}
