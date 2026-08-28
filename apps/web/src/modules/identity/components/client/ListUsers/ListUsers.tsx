"use client";

import { useState } from "react";

import { Pencil, Plus, Trash2 } from "@/components/icons";

import { CreateUserModal } from "@/modules/identity/components/client/CreateUserModal";
import { ConfirmDeleteUserModal } from "@/modules/identity/components/client/ConfirmDeleteUserModal";
import { EditUserModal } from "@/modules/identity/components/client/EditUserModal";

import { useUsers } from "@/modules/identity/hooks";

import {
  UserRole,
  type UserListItem,
} from "@/modules/identity/types/user-list";

import styles from "./ListUsers.module.scss";

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuário",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SUPPORT: "Suporte",
};

export function ListUsers() {
  const [page, setPage] = useState(1);

  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);

  const [creatingUser, setCreatingUser] = useState(false);

  const { users, pagination, loading, error, reload } = useUsers({
    page,
    limit: 10,
  });

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

          <div className={styles.headerActions}>
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
        </header>

        {users.length === 0 ? (
          <div className={styles.empty}>
            <h2>Nenhum usuário encontrado</h2>

            <p>Não existem usuários cadastrados para exibir.</p>
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
                      <span className={styles.role}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.isActive ? styles.active : styles.inactive
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
                        {user.emailVerified ? "Verificado" : "Não verificado"}
                      </span>
                    </td>

                    <td>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("pt-BR")
                        : "Nunca"}
                    </td>

                    <td>
                      <div className={styles.actionButtons}>
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
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
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

// "use client";

// import { useState } from "react";

// import styles from "./ListUsers.module.scss";

// import {
//   Pencil,
//   Plus,
//   Trash2,
// } from "@/components/icons";

// import { CreateUserModal } from "@/modules/identity/components/client/CreateUserModal";
// import { EditUserModal } from "@/modules/identity/components/client/EditUserModal";

// import {
//   useDeleteUser,
//   useUsers,
// } from "@/modules/identity/hooks";

// import {
//   UserRole,
//   type UserListItem,
// } from "@/modules/identity/types/user-list";

// const ROLE_LABELS: Record<UserRole, string> = {
//   USER: "Usuário",
//   ADMIN: "Administrador",
//   MANAGER: "Gerente",
//   SUPPORT: "Suporte",
// };

// export function ListUsers() {
//   const [page, setPage] = useState(1);

//   const [editingUser, setEditingUser] =
//     useState<UserListItem | null>(null);

//   const [creatingUser, setCreatingUser] =
//     useState(false);

//   const [deletingUser, setDeletingUser] =
//     useState<UserListItem | null>(null);

//   const {
//     users,
//     pagination,
//     loading,
//     error,
//     reload,
//   } = useUsers({
//     page,
//     limit: 10,
//   });

//   const {
//     remove,
//     loading: deleteLoading,
//     error: deleteError,
//   } = useDeleteUser();

//   function handleEdit(user: UserListItem) {
//     setEditingUser(user);
//   }

//   function handleCloseEdit() {
//     setEditingUser(null);
//   }

//   async function handleEditSuccess() {
//     setEditingUser(null);

//     await reload();
//   }

//   function handleDeleteClick(user: UserListItem) {
//     setDeletingUser(user);
//   }

//   function handleCloseDelete() {
//     if (deleteLoading) {
//       return;
//     }

//     setDeletingUser(null);
//   }

//   async function handleDelete() {
//     if (!deletingUser) {
//       return;
//     }

//     try {
//       await remove(deletingUser.id);

//       setDeletingUser(null);

//       await reload();
//     } catch {
//       // O erro já está disponível através do hook.
//     }
//   }

//   if (loading && !pagination) {
//     return (
//       <section className={styles.container}>
//         <div className={styles.loading}>
//           Carregando usuários...
//         </div>
//       </section>
//     );
//   }

//   if (error && !pagination) {
//     return (
//       <section className={styles.container}>
//         <div className={styles.error}>
//           Não foi possível carregar os usuários.
//         </div>
//       </section>
//     );
//   }

//   return (
//     <>
//       <section className={styles.container}>
//         <header className={styles.header}>
//           <div>
//             <h1 className={styles.title}>
//               Usuários
//             </h1>

//             <p className={styles.description}>
//               Gerencie os usuários da plataforma.
//             </p>
//           </div>

//           <div className={styles.headerActions}>
//             {pagination && (
//               <span className={styles.total}>
//                 {pagination.total} usuário
//                 {pagination.total !== 1
//                   ? "s"
//                   : ""}
//               </span>
//             )}

//             <button
//               type="button"
//               className={styles.addButton}
//               onClick={() =>
//                 setCreatingUser(true)
//               }
//             >
//               <Plus
//                 size={18}
//                 strokeWidth={1.8}
//               />

//               <span>
//                 Adicionar usuário
//               </span>
//             </button>
//           </div>
//         </header>

//         {users.length === 0 ? (
//           <div className={styles.empty}>
//             <h2>
//               Nenhum usuário encontrado
//             </h2>

//             <p>
//               Não existem usuários cadastrados
//               para exibir.
//             </p>
//           </div>
//         ) : (
//           <div className={styles.tableWrapper}>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th>Nome</th>
//                   <th>E-mail</th>
//                   <th>Perfil</th>
//                   <th>Status</th>
//                   <th>E-mail</th>
//                   <th>Último acesso</th>
//                   <th>Ações</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {users.map((user) => (
//                   <tr key={user.id}>
//                     <td>
//                       <div
//                         className={styles.user}
//                       >
//                         <strong>
//                           {user.name}
//                         </strong>
//                       </div>
//                     </td>

//                     <td>
//                       {user.email}
//                     </td>

//                     <td>
//                       <span
//                         className={
//                           styles.role
//                         }
//                       >
//                         {ROLE_LABELS[
//                           user.role
//                         ] ?? user.role}
//                       </span>
//                     </td>

//                     <td>
//                       <span
//                         className={
//                           user.isActive
//                             ? styles.active
//                             : styles.inactive
//                         }
//                       >
//                         {user.isActive
//                           ? "Ativo"
//                           : "Inativo"}
//                       </span>
//                     </td>

//                     <td>
//                       <span
//                         className={
//                           user.emailVerified
//                             ? styles.verified
//                             : styles.unverified
//                         }
//                       >
//                         {user.emailVerified
//                           ? "Verificado"
//                           : "Não verificado"}
//                       </span>
//                     </td>

//                     <td>
//                       {user.lastLoginAt
//                         ? new Date(
//                             user.lastLoginAt,
//                           ).toLocaleString(
//                             "pt-BR",
//                           )
//                         : "Nunca"}
//                     </td>

//                     <td>
//                       <div
//                         className={
//                           styles.actions
//                         }
//                       >
//                         <button
//                           type="button"
//                           className={
//                             styles.editButton
//                           }
//                           aria-label={`Editar usuário ${user.name}`}
//                           title="Editar usuário"
//                           onClick={() =>
//                             handleEdit(user)
//                           }
//                         >
//                           <Pencil
//                             size={16}
//                             strokeWidth={1.8}
//                           />
//                         </button>

//                         <button
//                           type="button"
//                           className={
//                             styles.deleteButton
//                           }
//                           aria-label={`Excluir usuário ${user.name}`}
//                           title="Excluir usuário"
//                           onClick={() =>
//                             handleDeleteClick(
//                               user,
//                             )
//                           }
//                         >
//                           <Trash2
//                             size={16}
//                             strokeWidth={1.8}
//                           />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {pagination &&
//           pagination.totalPages > 1 && (
//             <footer
//               className={
//                 styles.pagination
//               }
//             >
//               <button
//                 type="button"
//                 disabled={
//                   pagination.page <= 1
//                 }
//                 onClick={() =>
//                   setPage(
//                     (current) =>
//                       current - 1,
//                   )
//                 }
//               >
//                 Anterior
//               </button>

//               <span>
//                 Página{" "}
//                 {pagination.page} de{" "}
//                 {pagination.totalPages}
//               </span>

//               <button
//                 type="button"
//                 disabled={
//                   pagination.page >=
//                   pagination.totalPages
//                 }
//                 onClick={() =>
//                   setPage(
//                     (current) =>
//                       current + 1,
//                   )
//                 }
//               >
//                 Próxima
//               </button>
//             </footer>
//           )}
//       </section>

//       <CreateUserModal
//         open={creatingUser}
//         onClose={() =>
//           setCreatingUser(false)
//         }
//         onSuccess={reload}
//       />

//       <EditUserModal
//         user={editingUser}
//         open={
//           editingUser !== null
//         }
//         onClose={handleCloseEdit}
//         onSuccess={handleEditSuccess}
//       />

//       {deletingUser && (
//         <div
//           className={styles.deleteOverlay}
//           role="presentation"
//         >
//           <div
//             className={
//               styles.deleteDialog
//             }
//             role="alertdialog"
//             aria-modal="true"
//             aria-labelledby="delete-user-title"
//           >
//             <div
//               className={
//                 styles.deleteIcon
//               }
//             >
//               <Trash2
//                 size={24}
//                 strokeWidth={1.8}
//               />
//             </div>

//             <h2
//               id="delete-user-title"
//             >
//               Excluir usuário?
//             </h2>

//             <p>
//               Você está prestes a excluir
//               o usuário{" "}
//               <strong>
//                 {deletingUser.name}
//               </strong>
//               .
//             </p>

//             <p>
//               O usuário será removido da
//               lista, mas seus dados serão
//               preservados.
//             </p>

//             {deleteError && (
//               <div
//                 className={styles.error}
//                 role="alert"
//               >
//                 Não foi possível excluir
//                 o usuário.
//               </div>
//             )}

//             <div
//               className={
//                 styles.deleteActions
//               }
//             >
//               <button
//                 type="button"
//                 onClick={
//                   handleCloseDelete
//                 }
//                 disabled={deleteLoading}
//               >
//                 Cancelar
//               </button>

//               <button
//                 type="button"
//                 className={
//                   styles.confirmDeleteButton
//                 }
//                 onClick={handleDelete}
//                 disabled={deleteLoading}
//               >
//                 {deleteLoading
//                   ? "Excluindo..."
//                   : "Excluir usuário"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
