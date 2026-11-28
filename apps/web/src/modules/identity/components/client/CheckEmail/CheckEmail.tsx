"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AuthHeader } from "../..";
import { useVerifyEmail } from "../../../hooks/client";

import styles from "./CheckEmail.module.scss";

interface CheckEmailProps {
  token: string;
}

type VerificationStatus = "verifying" | "success" | "error";

function getEmailProviderUrl(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase();

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return "https://mail.google.com/";
  }

  if (
    ["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)
  ) {
    return "https://outlook.live.com/mail/0/";
  }

  if (["yahoo.com", "yahoo.com.br"].includes(domain)) {
    return "https://mail.yahoo.com/";
  }

  if (domain === "icloud.com" || domain === "me.com") {
    return "https://www.icloud.com/mail/";
  }

  return `mailto:${email}`;
}


export function CheckEmail({ token }: CheckEmailProps) {
  const { verifyEmail } = useVerifyEmail();

  const [status, setStatus] = useState<VerificationStatus>(
    token ? "verifying" : "error",
  );
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    setRegisteredEmail(
      sessionStorage.getItem("ccpf:verification-email") ?? "",
    );
  }, []);

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!token || verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    async function verify() {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    }

    void verify();
  }, [token, verifyEmail]);

  if (status === "verifying") {
    return (
      <div className={styles.container}>
        <AuthHeader
          title="Verificando seu e-mail"
          subtitle="Aguarde enquanto confirmamos seu endereço de e-mail."
        />

        <div className={styles.actions}>
          <p>Verificando seu e-mail...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.container}>
        <AuthHeader
          title="E-mail verificado!"
          subtitle="Sua conta foi confirmada com sucesso. Agora você pode acessar o CCPF."
        />

        <div className={styles.actions}>
          <Link href="/login" className={styles.backToLogin}>
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <AuthHeader
          title="Verifique seu e-mail"
          subtitle={
            registeredEmail
              ? `Enviamos um link de confirmação para ${registeredEmail}.`
              : "Acesse seu e-mail e clique no link de confirmação para ativar sua conta."
          }
        />

        <div className={styles.actions}>
          {registeredEmail && (
            <a
              href={getEmailProviderUrl(registeredEmail)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openEmail}
            >
              Abrir meu e-mail
            </a>
          )}

          <Link href="/login" className={styles.backToLogin}>
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AuthHeader
        title="Não foi possível verificar seu e-mail"
        subtitle={
          token
            ? "O link de verificação é inválido ou expirou."
            : "O link de verificação é inválido."
        }
      />

      <div className={styles.actions}>
        <Link href="/login" className={styles.backToLogin}>
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
