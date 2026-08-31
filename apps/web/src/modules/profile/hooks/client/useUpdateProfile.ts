"use client";

import { useState } from "react";

import { useIdentityStore } from "@/modules/identity/stores/identity.store";

import { profileService } from "../../services/profile.service";

import type { UpdateProfileInput } from "../../types";

export function useUpdateProfile() {
  const updateUserProfile = useIdentityStore(
    (state) => state.updateUserProfile,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function updateProfile(data: UpdateProfileInput) {
    setLoading(true);
    setError(null);

    try {
      const profile = await profileService.update(data);

      updateUserProfile({
        name: profile.name,
        email: profile.email,
      });

      return profile;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    updateProfile,
    loading,
    error,
  };
}
