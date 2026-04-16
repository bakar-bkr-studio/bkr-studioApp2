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
  id?: string;
  label?: string;
  name?: string;
  url?: string;
  category?: string | null;
  isPinned?: boolean;
  pinned?: boolean;
  openCount?: number;
  lastOpenedAt?: string | null;
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

  return value.reduce<DashboardUsefulLink[]>((accumulator, item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return accumulator;
    }

    const record = item as UsefulLinkRecord;
    const nowIso = new Date().toISOString();
    const id =
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : `link-${Date.now()}-${index}`;
    const labelSource = typeof record.label === "string" ? record.label : record.name;
    const label = typeof labelSource === "string" ? labelSource.trim() : "";
    const url = typeof record.url === "string" ? record.url.trim() : "";

    if (!label || !url) {
      return accumulator;
    }

    accumulator.push({
      id,
      label,
      url,
      category: typeof record.category === "string" ? record.category : null,
      isPinned:
        typeof record.isPinned === "boolean"
          ? record.isPinned
          : Boolean(record.pinned),
      openCount:
        typeof record.openCount === "number" && Number.isFinite(record.openCount)
          ? Math.max(0, Math.round(record.openCount))
          : 0,
      lastOpenedAt:
        typeof record.lastOpenedAt === "string" ? record.lastOpenedAt : null,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : nowIso,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : nowIso,
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
