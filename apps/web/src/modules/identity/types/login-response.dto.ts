import type { User } from "./user";

export interface LoginResponseDto {
  accessToken: string;
  user: User;
}
