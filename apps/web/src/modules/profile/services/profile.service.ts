import { api } from "@/lib/api/client";

import type {
  ChangePasswordInput,
  ChangePasswordResponse,
  Profile,
  UpdateProfileInput,
} from "../types";

class ProfileService {
  get() {
    return api.get<Profile>("/profile");
  }

  update(data: UpdateProfileInput) {
    return api.patch<Profile>("/profile", data);
  }

  changePassword(data: ChangePasswordInput) {
    return api.patch<ChangePasswordResponse>(
      "/profile/password",
      data,
    );
  }
}

export const profileService = new ProfileService();
