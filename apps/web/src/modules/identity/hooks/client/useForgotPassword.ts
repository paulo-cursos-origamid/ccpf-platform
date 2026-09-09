import { useState } from "react";

import { identityService } from "../../services/identity.service";
import type { ForgotPasswordDto } from "../../types/forgot-password.dto";

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);

  async function forgotPassword(data: ForgotPasswordDto) {
    setLoading(true);

    try {
      await identityService.forgotPassword(data);
    } finally {
      setLoading(false);
    }
  }

  return {
    forgotPassword,
    loading,
  };
}
