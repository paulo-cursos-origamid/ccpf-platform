import { create } from "zustand";

import type { User } from "../types/user";
import type { LoginDto } from "../types/login.dto";

import { identityService } from "../services/identity.service";

interface IdentityState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  login: (data: LoginDto) => Promise<void>;

  logout: () => Promise<void>;

  loadUser: () => Promise<void>;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  user: null,

  isAuthenticated: false,

  loading: false,

  login: async (data) => {
    set({
      loading: true,
    });

    try {
      const response = await identityService.login(data);

      set({
        user: response.user,
        isAuthenticated: true,
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  logout: async () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    set({
      loading: true,
    });

    try {
      const user = await identityService.me();

      set({
        user,
        isAuthenticated: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({
        loading: false,
      });
    }
  },
}));
