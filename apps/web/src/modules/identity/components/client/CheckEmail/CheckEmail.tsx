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

export function CheckEmail({ token }: CheckEmailProps) {
  const { verifyEmail } = useVerifyEmail();

  const [status, setStatus] = useState<VerificationStatus>(
    token ? "verifying" : "error",
  );
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
