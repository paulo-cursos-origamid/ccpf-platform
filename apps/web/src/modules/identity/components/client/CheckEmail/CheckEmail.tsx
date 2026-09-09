import Link from "next/link";

import styles from "./CheckEmail.module.scss";
import { AuthHeader } from "../..";

export function CheckEmail() {
  return (
    <div className={styles.container}>
        <AuthHeader
        title="Verifique seu e-mail"
        subtitle="Enviamos instruções para redefinir sua senha. Verifique sua caixa de entrada e siga o link enviado para você."
      />
      <div className={styles.actions}>
        <Link href="/login" className={styles.backToLogin}>
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
