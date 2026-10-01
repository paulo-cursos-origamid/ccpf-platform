"use client";

import { useState } from "react";

import { Pencil, Plus, Search, Trash2, X } from "@/components/icons";
import { SearchInput } from "@/components/ui/forms";

import { CreateUserModal } from "@/modules/identity/components/client/CreateUserModal";
import { ConfirmDeleteUserModal } from "@/modules/identity/components/client/ConfirmDeleteUserModal";
import { EditUserModal } from "@/modules/identity/components/client/EditUserModal";

import { useUsers } from "@/modules/identity/hooks";

import type { UserListItem } from "@/modules/identity/types/user-list";

import styles from "./ListUsers.module.scss";

export function ListUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const { users, pagination, loading, error, reload } = useUsers({
    page,
    limit: 10,
    search,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleClearSearch() {
    setSearch("");
    setPage(1);
  }

  function handleEdit(user: UserListItem) {
    setEditingUser(user);
  }

  function handleCloseEdit() {
    setEditingUser(null);
  }

  async function handleEditSuccess() {
    setEditingUser(null);

    await reload();
  }

  function handleDelete(user: UserListItem) {
    setDeletingUser(user);
  }

  function handleCloseDelete() {
    setDeletingUser(null);
  }

  async function handleDeleteSuccess() {
    setDeletingUser(null);

    await reload();
  }

  async function handleCreateSuccess() {
    setCreatingUser(false);

    await reload();
  }

  if (loading && !pagination) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>Carregando usuários...</div>
      </section>
    );
  }

  if (error && !pagination) {
    return (
      <section className={styles.container}>
        <div className={styles.error}>
          Não foi possível carregar os usuários.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Usuários</h1>

            <p className={styles.description}>
              Gerencie os usuários da plataforma.
            </p>
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <SearchInput
              className={styles.searchInput}
              value={search}
              placeholder="Buscar por nome ou e-mail..."
              aria-label="Buscar usuários por nome ou e-mail"
              leftIcon={
                <Search
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              }
              rightIcon={
                search ? (
                  <button
                    type="button"
                    className={styles.clearSearchButton}
                    aria-label="Limpar busca"
                    title="Limpar busca"
                    onClick={handleClearSearch}
                  >
                    <X size={16} strokeWidth={1.8} />
                  </button>
                ) : undefined
              }
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
            />
          </div>

          <div className={styles.toolbarActions}>
            {pagination && (
              <span className={styles.total}>
                {pagination.total} usuário
                {pagination.total !== 1 ? "s" : ""}
              </span>
            )}

            <button
              type="button"
              className={styles.addButton}
              aria-label="Adicionar usuário"
              title="Adicionar usuário"
              onClick={() => setCreatingUser(true)}
            >
              <Plus size={18} strokeWidth={1.8} />

              <span>Adicionar usuário</span>
            </button>
          </div>
        </div>

        {loading && pagination && (
          <div className={styles.loadingInline}>
            Atualizando usuários...
          </div>
        )}

        {users.length === 0 ? (
          <div className={styles.empty}>
            <h2>
              {search
                ? "Nenhum usuário encontrado"
                : "Nenhum usuário cadastrado"}
            </h2>

            <p>
              {search
                ? "Tente buscar por outro nome ou endereço de e-mail."
                : "Não existem usuários cadastrados para exibir."}
            </p>

            {search && (
              <button
                type="button"
                className={styles.clearSearchAction}
                onClick={handleClearSearch}
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Verificação</th>
                  <th>Último acesso</th>
                  <th>Ações</th>
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

                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.editButton}
                          aria-label={`Editar usuário ${user.name}`}
                          title="Editar usuário"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil size={16} strokeWidth={1.8} />
                        </button>

                        <button
                          type="button"
                          className={styles.deleteButton}
                          aria-label={`Remover usuário ${user.name}`}
                          title="Remover usuário"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 size={16} strokeWidth={1.8} />
                        </button>
                      </div>
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
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                pagination.page >= pagination.totalPages || loading
              }
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </button>
          </footer>
        )}
      </section>

      <CreateUserModal
        open={creatingUser}
        onClose={() => setCreatingUser(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditUserModal
        user={editingUser}
        open={editingUser !== null}
        onClose={handleCloseEdit}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDeleteUserModal
        user={deletingUser}
        open={deletingUser !== null}
        onClose={handleCloseDelete}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
