import { useState } from "react";

import { userService } from "../../services/user.service";

import type { UpdateUserInput } from "../../types/update-user";
import type { UserListItem } from "../../types/user-list";

interface UseUpdateUserState {
  loading: boolean;
  error: Error | null;
}

export function useUpdateUser() {
  const [state, setState] = useState<UseUpdateUserState>({
    loading: false,
    error: null,
  });

  async function update(
    id: string,
    data: UpdateUserInput,
  ): Promise<UserListItem> {
    setState({
      loading: true,
      error: null,
    });

    try {
      const user = await userService.update(id, data);

      setState({
        loading: false,
        error: null,
      });

      return user;
    } catch (error) {
      setState({
        loading: false,
        error: error as Error,
      });

      throw error;
    }
  }

  return {
    update,
    loading: state.loading,
    error: state.error,
  };
}