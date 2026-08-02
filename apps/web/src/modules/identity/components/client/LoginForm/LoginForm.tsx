"use client";

import styles from "./LoginForm.module.scss";

export function LoginForm() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Entrar</h1>

        <p className={styles.subtitle}>Acesse sua conta no CCPF Platform</p>

        <form className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>

            <input type="email" placeholder="seu@email.com" />
          </div>

          <div className={styles.field}>
            <label>Senha</label>

            <input type="password" placeholder="********" />
          </div>

          <button className={styles.button} type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
