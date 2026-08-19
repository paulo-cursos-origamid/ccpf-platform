"use client";

import { useState } from "react";
import styles from "./ListUsers.module.scss";

import { UserRole } from "@/modules/identity/types";
import { useUsers } from "@/modules/identity/hooks";

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuário",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SUPPORT: "Suporte",
};

export function ListUsers() {
  const [page, setPage] = useState(1);

  const {
    users,
    pagination,
    loading,
    error,
  } = useUsers({
    page,
    limit: 10,
  });

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>
          Carregando usuários...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.container}>
        <div className={styles.error}>
          Não foi possível carregar os usuários.
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários</h1>

          <p className={styles.description}>
            Gerencie os usuários da plataforma.
          </p>
        </div>

        {pagination && (
          <span className={styles.total}>
            {pagination.total} usuário
            {pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {users.length === 0 ? (
        <div className={styles.empty}>
          <h2>Nenhum usuário encontrado</h2>

          <p>
            Não existem usuários cadastrados para exibir.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>E-mail</th>
                <th>Último acesso</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.user}>
                      <strong>{user.name}</strong>
                    </div>
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <span className={styles.role}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        user.isActive
                          ? styles.active
                          : styles.inactive
                      }
                    >
                      {user.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        user.emailVerified
                          ? styles.verified
                          : styles.unverified
                      }
                    >
                      {user.emailVerified
                        ? "Verificado"
                        : "Não verificado"}
                    </span>
                  </td>

                  <td>
                    {user.lastLoginAt
                      ? new Date(
                          user.lastLoginAt,
                        ).toLocaleString("pt-BR")
                      : "Nunca"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <footer className={styles.pagination}>
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </button>

          <span>
            Página {pagination.page} de{" "}
            {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={
              pagination.page >= pagination.totalPages
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </button>
        </footer>
      )}
    </section>
  );
}