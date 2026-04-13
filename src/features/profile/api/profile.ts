import { apiRequest } from "@/lib/api-client";
import type {
  CurrencyCode,
  DashboardUsefulLink,
  DataMode,
  UserProfile,
} from "@/types";

export interface ProfileAuthUser {
  id: string;
  email?: string | null;
}

export type UpdateUserProfileInput = Partial<
  Pick<
    UserProfile,
    | "firstName"
    | "lastName"
    | "displayName"
    | "onboardingCompleted"
    | "businessName"
    | "role"
    | "specialty"
    | "email"
    | "phone"
    | "city"
    | "country"
    | "currency"
    | "bio"
    | "avatarUrl"
    | "dashboardNotes"
    | "usefulLinks"
    | "accountStatus"
  >
>;

interface ProfileResponse {
  profile: UserProfile;
}

export interface UserDashboardData {
  dashboardNotes: string | null;
  usefulLinks: DashboardUsefulLink[];
}

interface UsefulLinkRecord {
  id: string;
  label: string;
  url: string;
  category?: string;
  isPinned?: boolean;
  openCount?: number;
  lastOpenedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function normalizeCurrency(value: unknown): CurrencyCode {
  if (value === "EUR" || value === "USD" || value === "NGN") {
    return value;
  }

  return "EUR";
}

function normalizeAccountStatus(value: unknown): DataMode {
  return value === "firebase" ? "firebase" : "mock";
}

function normalizeUsefulLinks(value: unknown): DashboardUsefulLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<DashboardUsefulLink[]>((accumulator, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return accumulator;
    }

    const record = item as UsefulLinkRecord;

    if (typeof record.id !== "string" || typeof record.label !== "string" || typeof record.url !== "string") {
      return accumulator;
    }

    accumulator.push({
      id: record.id,
      label: record.label,
      url: record.url,
      category: typeof record.category === "string" ? record.category : undefined,
      isPinned: Boolean(record.isPinned),
      openCount:
        typeof record.openCount === "number" && Number.isFinite(record.openCount)
          ? Math.max(0, Math.round(record.openCount))
          : 0,
      lastOpenedAt:
        typeof record.lastOpenedAt === "string" ? record.lastOpenedAt : undefined,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    });

    return accumulator;
  }, []);
}

function normalizeUserProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    onboardingCompleted: profile.onboardingCompleted === true,
    currency: normalizeCurrency(profile.currency),
    accountStatus: normalizeAccountStatus(profile.accountStatus),
    usefulLinks: normalizeUsefulLinks(profile.usefulLinks),
  };
}

export async function getOrCreateUserProfile(_user?: ProfileAuthUser): Promise<UserProfile> {
  const response = await apiRequest<ProfileResponse>("/api/v1/profile", {
    method: "GET",
  });

  return normalizeUserProfile(response.profile);
}

export async function updateUserProfile(
  data: UpdateUserProfileInput
): Promise<UserProfile> {
  const response = await apiRequest<ProfileResponse>("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  return normalizeUserProfile(response.profile);
}

export async function getUserDashboardData(
  _user?: ProfileAuthUser
): Promise<UserDashboardData> {
  const profile = await getOrCreateUserProfile();

  return {
    dashboardNotes: profile.dashboardNotes,
    usefulLinks: profile.usefulLinks,
  };
}

export async function updateUserDashboardData(
  data: Partial<UserDashboardData>
): Promise<UserDashboardData> {
  const profile = await updateUserProfile(data);

  return {
    dashboardNotes: profile.dashboardNotes,
    usefulLinks: profile.usefulLinks,
  };
}
