"use client";

import { useState } from "react";

import { profileService } from "../../services/profile.service";

import type {
  ChangePasswordInput,
  ChangePasswordResponse,
} from "../../types";

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function changePassword(
    data: ChangePasswordInput,
  ): Promise<ChangePasswordResponse> {
    setLoading(true);
    setError(null);

    try {
      return await profileService.changePassword(data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    changePassword,
    loading,
    error,
  };
}
