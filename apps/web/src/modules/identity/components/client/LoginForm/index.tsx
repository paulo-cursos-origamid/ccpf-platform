"use client";

import { useLogin } from "@/modules/identity/hooks/client";
import { useState } from "react";


export function LoginForm() {
  const { login, loading } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    await login({
      email,
      password,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />

      <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}
