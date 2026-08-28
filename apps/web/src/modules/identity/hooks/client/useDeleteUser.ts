"use client";

import { useState } from "react";

import { userService } from "../../services/user.service";

interface UseDeleteUserState {
  loading: boolean;
  error: unknown;
}

export function useDeleteUser() {
  const [state, setState] = useState<UseDeleteUserState>({
    loading: false,
    error: null,
  });

  async function remove(id: string) {
    setState({
      loading: true,
      error: null,
    });

    try {
      await userService.delete(id);

      setState({
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        error,
      });

      throw error;
    }
  }

  return {
    remove,
    loading: state.loading,
    error: state.error,
  };
}