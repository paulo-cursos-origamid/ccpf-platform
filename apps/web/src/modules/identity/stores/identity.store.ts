import { create } from "zustand";

import type { User } from "../types/user";
import type { LoginDto } from "../types/login.dto";

import { identityService } from "../services/identity.service";

interface IdentityState {
  user: User | null;

  isAuthenticated: boolean;

  loading: boolean;

  initialized: boolean;

  login: (data: LoginDto) => Promise<void>;

  logout: () => Promise<void>;

  loadUser: () => Promise<void>;

  initialize: () => Promise<void>;

  setUser: (user: User) => void;

  updateUserProfile: (data: Pick<User, "name" | "email">) => void;
}

export const useIdentityStore = create<IdentityState>()((set) => ({
  user: null,

  isAuthenticated: false,

  loading: false,

  initialized: false,

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  updateUserProfile: (data) => {
    set((state) => {
      if (!state.user) {
        return state;
      }

      return {
        user: {
          ...state.user,
          ...data,
        },
      };
    });
  },

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
    try {
      await identityService.logout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
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

  initialize: async () => {
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
        initialized: true,
      });
    }
  },
}));
