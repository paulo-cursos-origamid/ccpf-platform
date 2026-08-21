"use client";

import { useState } from "react";

import { identityService } from "../../services/identity.service";

import type { RegisterDto } from "../../types/register.dto";
import type { User } from "../../types/user";

interface UseRegisterState {
  data: User | null;
  loading: boolean;
  error: unknown;
}

export function useRegister() {
  const [state, setState] = useState<UseRegisterState>({
    data: null,
    loading: false,
    error: null,
  });

  async function register(dto: RegisterDto) {
    setState({
      data: null,
      loading: true,
      error: null,
    });

    try {
      const data = await identityService.register(dto);

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
    register,
    data: state.data,
    loading: state.loading,
    error: state.error,
  };
}
