// src/modules/identity/constants/identity.constants.ts

export const IDENTITY_ENDPOINTS = {
  LOGIN: "/identity/login",
  LOGOUT: "/identity/logout",

  ME: "/identity/me",

  REFRESH: "/identity/refresh",

  USERS: "/identity/users",
} as const;

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "ccpf.access-token",
} as const;