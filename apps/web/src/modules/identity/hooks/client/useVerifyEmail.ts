import { useState } from "react";

import { identityService } from "../../services/identity.service";

export function useVerifyEmail() {
  const [loading, setLoading] = useState(false);

  async function verifyEmail(token: string) {
    setLoading(true);

    try {
      await identityService.verifyEmail({ token });
    } finally {
      setLoading(false);
    }
  }

  return {
    verifyEmail,
    loading,
  };
}