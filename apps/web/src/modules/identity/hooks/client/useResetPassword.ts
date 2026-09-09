import { useState } from "react";

import { identityService } from "../../services/identity.service";
import type { ResetPasswordDto } from "../../types/reset-password.dto";

export function useResetPassword() {
  const [loading, setLoading] = useState(false);

  async function resetPassword(data: ResetPasswordDto) {
    setLoading(true);

    try {
      await identityService.resetPassword(data);
    } finally {
      setLoading(false);
    }
  }

  return {
    resetPassword,
    loading,
  };
}
