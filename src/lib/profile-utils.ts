import type { UserProfile } from "@/types";

export type ProfileSectionKey = "identity" | "contact" | "activity" | "account";

export interface ProfileSectionItem {
  key: keyof UserProfile;
  label: string;
  value: string;
}

export type ProfileSections = Record<ProfileSectionKey, ProfileSectionItem[]>;

export function getProfileSections(profile: UserProfile): ProfileSections {
  const identity: ProfileSectionItem[] = [
    { key: "firstName", label: "Prénom", value: profile.firstName },
    { key: "lastName", label: "Nom", value: profile.lastName },
    { key: "displayName", label: "Nom affiché", value: profile.displayName },
    { key: "businessName", label: "Nom d'activité", value: profile.businessName ?? "" },
    { key: "role", label: "Rôle", value: profile.role ?? "" },
    { key: "specialty", label: "Spécialité", value: profile.specialty ?? "" },
  ];

  const contact: ProfileSectionItem[] = [
    { key: "email", label: "Email", value: profile.email ?? "" },
    { key: "phone", label: "Téléphone", value: profile.phone ?? "" },
    { key: "city", label: "Ville", value: profile.city ?? "" },
    { key: "country", label: "Pays", value: profile.country ?? "" },
  ];

  const activity: ProfileSectionItem[] = [
    { key: "currency", label: "Devise", value: profile.currency },
    { key: "bio", label: "Bio", value: profile.bio ?? "" },
  ];

  const account: ProfileSectionItem[] = [
    { key: "userId", label: "ID utilisateur", value: profile.userId },
    { key: "accountStatus", label: "Statut du compte", value: profile.accountStatus },
    { key: "createdAt", label: "Compte créé le", value: profile.createdAt },
    { key: "updatedAt", label: "Dernière mise à jour", value: profile.updatedAt },
  ];

  return {
    identity,
    contact,
    activity,
    account,
  };
}
