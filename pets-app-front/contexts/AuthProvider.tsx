import { AppUsersModel, PetModel } from "@/data/models";
import {
  ApiRequestError,
  AuthSession,
  apiRequest,
  clearAuthSession,
  getAuthSession,
  getCachedPets,
  getCachedProfile,
  getLastOpenedAt,
  getProfileCacheUpdatedAt,
  resolveApiUrl,
  saveAuthSession,
  saveCachedPets,
  saveCachedProfile,
  saveLastOpenedAt,
  saveProfileCacheUpdatedAt,
  setUnauthorizedHandler,
} from "@/lib/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

const AUTH_INACTIVITY_LIMIT_MS = 90 * 24 * 60 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 10 * 60 * 1000;

type ApiUserResponse = {
  id: number;
  username: string;
  name?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  image?: string | null;
  description?: string | null;
  createdAt: string;
  lastLogin?: string | null;
};

type ApiPetResponse = {
  id: string;
  userId: number;
  name: string;
  speciesId: number;
  species: string;
  breedId?: number | null;
  breed?: string | null;
  sex: "Male" | "Female";
  birthDate?: string | null;
  weightKg?: number | null;
  color: string;
  neutered: boolean;
  avatarUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  user: AppUsersModel | null;
  pets: PetModel[];
  isAuthenticated: boolean;
  isHydrating: boolean;
  isRefreshingProfile: boolean;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: (options?: { notifyServer?: boolean }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  shouldRefreshProfile: (maxAgeMs?: number) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUserToModel(user: ApiUserResponse): AppUsersModel {
  return {
    Id: user.id,
    Name: user.name || `${user.firstName} ${user.lastName}`.trim(),
    FirstName: user.firstName,
    LastName: user.lastName,
    Email: user.email,
    PhoneNumber: user.phoneNumber,
    PasswordHash: "",
    Image: resolveApiUrl(user.image ?? null),
    CreatedAt: user.createdAt,
    LastLogin: user.lastLogin ?? null,
    Description: user.description ?? "",
    BookmarkedPostID: [],
  };
}

function mapPetToModel(pet: ApiPetResponse): PetModel {
  return {
    Id: pet.id,
    UserId: pet.userId,
    Name: pet.name,
    SpeciesId: pet.speciesId,
    BreedId: pet.breedId ?? null,
    Sex: pet.sex,
    BirthDate: pet.birthDate ?? null,
    WeightKg: pet.weightKg ?? null,
    Color: pet.color,
    Neutered: pet.neutered,
    AvatarUrl: resolveApiUrl(pet.avatarUrl ?? null),
    Notes: pet.notes ?? "",
    CreatedAt: pet.createdAt,
    UpdatedAt: pet.updatedAt,
    Species: pet.species.toLowerCase(),
    Breed: pet.breed ?? null,
    ConsultationsId: [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AppUsersModel | null>(null);
  const [pets, setPets] = useState<PetModel[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [profileCacheUpdatedAt, setProfileCacheUpdatedAt] = useState<
    number | null
  >(null);

  const sessionRef = useRef<AuthSession | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const signOutInProgressRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const clearMemoryState = useCallback(() => {
    refreshPromiseRef.current = null;
    setSession(null);
    setUser(null);
    setPets([]);
    setIsRefreshingProfile(false);
    setProfileCacheUpdatedAt(null);
  }, []);

  const clearCachedProfileState = useCallback(async () => {
    await Promise.all([
      saveCachedProfile(null),
      saveCachedPets([]),
      saveProfileCacheUpdatedAt(null),
    ]);
  }, []);

  const signOut = useCallback(
    async ({ notifyServer = true }: { notifyServer?: boolean } = {}) => {
      if (signOutInProgressRef.current) {
        return;
      }

      signOutInProgressRef.current = true;

      try {
        if (notifyServer && sessionRef.current?.accessToken) {
          try {
            await apiRequest("/api/Auth/logout", { method: "POST" });
          } catch (error) {
            if (!(error instanceof ApiRequestError && error.status === 401)) {
              console.error("[auth] Logout request failed", error);
            }
          }
        }

        await clearAuthSession();
        clearMemoryState();
      } finally {
        signOutInProgressRef.current = false;
      }
    },
    [clearMemoryState],
  );

  const loadFreshProfile = useCallback(async (activeSession: AuthSession) => {
    const [userResponse, petsResponse] = await Promise.all([
      apiRequest<ApiUserResponse>("/api/Users/me"),
      apiRequest<ApiPetResponse[]>("/api/Pets"),
    ]);

    if (sessionRef.current?.accessToken !== activeSession.accessToken) {
      return;
    }

    const nextUser = mapUserToModel(userResponse);
    const nextPets = petsResponse.map(mapPetToModel);
    const cachedAt = Date.now();

    setUser(nextUser);
    setPets(nextPets);
    setProfileCacheUpdatedAt(cachedAt);

    await Promise.all([
      saveCachedProfile(nextUser),
      saveCachedPets(nextPets),
      saveProfileCacheUpdatedAt(cachedAt),
    ]);
  }, []);

  const refreshProfileForSession = useCallback(
    async (activeSession: AuthSession) => {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      setIsRefreshingProfile(true);

      const promise = loadFreshProfile(activeSession)
        .catch(async (error) => {
          if (error instanceof ApiRequestError && error.status === 401) {
            await signOut({ notifyServer: false });
            return;
          }

          throw error;
        })
        .finally(() => {
          if (refreshPromiseRef.current === promise) {
            refreshPromiseRef.current = null;
          }

          setIsRefreshingProfile(false);
        });

      refreshPromiseRef.current = promise;
      return promise;
    },
    [loadFreshProfile, signOut],
  );

  const refreshProfile = useCallback(async () => {
    if (!sessionRef.current) {
      return;
    }

    await refreshProfileForSession(sessionRef.current);
  }, [refreshProfileForSession]);

  const shouldRefreshProfile = useCallback(
    (maxAgeMs = PROFILE_CACHE_TTL_MS) => {
      if (!sessionRef.current) {
        return false;
      }

      if (!user || profileCacheUpdatedAt === null) {
        return true;
      }

      return Date.now() - profileCacheUpdatedAt > maxAgeMs;
    },
    [profileCacheUpdatedAt, user],
  );

  const hydrateAuth = useCallback(async () => {
    try {
      const [
        storedSession,
        cachedProfile,
        cachedPets,
        lastOpenedAt,
        cachedProfileUpdatedAt,
      ] = await Promise.all([
        getAuthSession(),
        getCachedProfile(),
        getCachedPets(),
        getLastOpenedAt(),
        getProfileCacheUpdatedAt(),
      ]);

      if (!storedSession) {
        clearMemoryState();
        return;
      }

      const now = Date.now();

      if (
        lastOpenedAt &&
        now - lastOpenedAt > AUTH_INACTIVITY_LIMIT_MS
      ) {
        await clearAuthSession();
        clearMemoryState();
        return;
      }

      setSession(storedSession);
      setUser(cachedProfile);
      setPets(cachedPets);
      setProfileCacheUpdatedAt(cachedProfileUpdatedAt);
      await saveLastOpenedAt(now);

      const cacheMissing = !cachedProfile;
      const cacheStale =
        cachedProfileUpdatedAt === null ||
        now - cachedProfileUpdatedAt > PROFILE_CACHE_TTL_MS;

      if (cacheMissing || cacheStale) {
        void refreshProfileForSession(storedSession);
      }
    } catch (error) {
      console.error("[auth] Failed to hydrate session", error);
      await clearAuthSession();
      clearMemoryState();
    } finally {
      setIsHydrating(false);
    }
  }, [clearMemoryState, refreshProfileForSession]);

  const signIn = useCallback(
    async (nextSession: AuthSession) => {
      await clearAuthSession();
      await saveAuthSession(nextSession);
      await saveLastOpenedAt(Date.now());
      await clearCachedProfileState();

      refreshPromiseRef.current = null;
      setSession(nextSession);
      setUser(null);
      setPets([]);
      setIsRefreshingProfile(false);
      setProfileCacheUpdatedAt(null);

      void refreshProfileForSession(nextSession);
    },
    [clearCachedProfileState, refreshProfileForSession],
  );

  const handleAppActivation = useCallback(async () => {
    if (!sessionRef.current) {
      return;
    }

    const now = Date.now();
    const lastOpenedAt = await getLastOpenedAt();

    if (
      lastOpenedAt &&
      now - lastOpenedAt > AUTH_INACTIVITY_LIMIT_MS
    ) {
      await signOut({ notifyServer: false });
      return;
    }

    await saveLastOpenedAt(now);
  }, [signOut]);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void handleAppActivation();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleAppActivation]);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut({ notifyServer: false }));

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      pets,
      isAuthenticated: !!session?.accessToken,
      isHydrating,
      isRefreshingProfile,
      signIn,
      signOut,
      refreshProfile,
      shouldRefreshProfile,
    }),
    [
      isHydrating,
      isRefreshingProfile,
      pets,
      refreshProfile,
      session,
      shouldRefreshProfile,
      signIn,
      signOut,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
