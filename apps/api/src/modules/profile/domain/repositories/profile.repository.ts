export interface ProfileData {
  id: string;
  name: string;
  email: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export abstract class ProfileRepository {
  abstract findByUserId(userId: string): Promise<ProfileData | null>;

  abstract update(
    userId: string,
    data: UpdateProfileData,
  ): Promise<ProfileData>;
}
