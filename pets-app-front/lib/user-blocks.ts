import { apiRequest } from "@/lib/api";

export type BlockedUser = {
  Id: string | number;
  Username: string;
  FirstName: string;
  LastName: string;
  AvatarUrl?: string | null;
  BlockedAt: string;
};

type ApiBlockedUserResponse = {
  id?: string | number;
  Id?: string | number;
  username?: string;
  Username?: string;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  avatarUrl?: string | null;
  AvatarUrl?: string | null;
  blockedAt?: string;
  BlockedAt?: string;
};

let blockedUsersPromise: Promise<BlockedUser[]> | null = null;

export async function getBlockedUsers({ force = false } = {}) {
  if (force || !blockedUsersPromise) {
    blockedUsersPromise = apiRequest<ApiBlockedUserResponse[]>(
      "/api/Users/blocked",
    ).then((users) =>
      users.map((user) => ({
        Id: user.id ?? user.Id ?? "",
        Username: user.username ?? user.Username ?? "",
        FirstName: user.firstName ?? user.FirstName ?? "",
        LastName: user.lastName ?? user.LastName ?? "",
        AvatarUrl: user.avatarUrl ?? user.AvatarUrl ?? null,
        BlockedAt: user.blockedAt ?? user.BlockedAt ?? "",
      })),
    );
  }

  return blockedUsersPromise;
}

export async function isUserBlocked(userId: string | number) {
  const blockedUsers = await getBlockedUsers();
  return blockedUsers.some((user) => String(user.Id) === String(userId));
}

export async function blockUser(userId: string | number) {
  const response = await apiRequest<{ message: string }>(`/api/Users/${userId}/block`, {
    method: "POST",
  });
  blockedUsersPromise = null;
  return response;
}

export async function unblockUser(userId: string | number) {
  const response = await apiRequest<void>(`/api/Users/${userId}/block`, {
    method: "DELETE",
  });
  blockedUsersPromise = null;
  return response;
}
