import { Inter, Montserrat } from "next/font/google";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { IdentityProvider } from "@/modules/identity/providers/IdentityProvider";
// import "@/styles/globals.scss";
import "@/styles/globals.scss";

export const metadata = {
  title: "CCPF - Centro de Controle Pessoal Financeiro",
  description: "Centro de Controle Pessoal Financeiro",
};
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["700", "800"],
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <ThemeProvider>
          <IdentityProvider>{children}</IdentityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
