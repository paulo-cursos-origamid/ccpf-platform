import type { UserRole } from "./user-list";

/**
 * Dados necessários para criação administrativa de um usuário.
 *
 * Este DTO é separado do cadastro público porque a criação administrativa
 * não participa da escolha de plano durante o registro público.
 */
export interface CreateUserDto {
  role?: UserRole;
  name: string;
  email: string;
  password: string;
}
