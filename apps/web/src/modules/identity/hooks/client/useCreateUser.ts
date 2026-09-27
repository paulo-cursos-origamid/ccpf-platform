"use client";

import { useState } from "react";

import { userService } from "../../services/user.service";

import type { RegisterDto } from "../../types/register.dto";
import type { User } from "../../types/user";

interface UseCreateUserState {
  data: User | null;
  loading: boolean;
  error: unknown;
}

export function useCreateUser() {
  const [state, setState] = useState<UseCreateUserState>({
    data: null,
    loading: false,
    error: null,
  });

  async function createUser(dto: RegisterDto) {
    setState({
      data: null,
      loading: true,
      error: null,
    });

    try {
      const data = await userService.create(dto);

      setState({
        data,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error,
      });

      throw error;
    }
  }

  return {
    createUser,
    data: state.data,
    loading: state.loading,
    error: state.error,
  };
}
