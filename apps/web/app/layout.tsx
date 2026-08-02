import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { IdentityProvider } from "@/modules/identity/providers/IdentityProvider";
// import "@/styles/globals.scss";
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
          <IdentityProvider>{children}</IdentityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
