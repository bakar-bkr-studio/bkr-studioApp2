"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageLoader from "@/components/PageLoader";
import ProfileField from "@/components/profile/ProfileField";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileModal, { type ProfileModalFormData } from "@/components/profile/ProfileModal";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";
import ProfileStatusBadge from "@/components/profile/ProfileStatusBadge";
import {
  getOrCreateUserProfile,
  updateUserProfile,
  type UpdateUserProfileInput,
} from "@/features/profile/api/profile";
import { useAuth } from "@/lib/auth/use-auth";
import { getProfileSections } from "@/lib/profile-utils";
import type { UserProfile } from "@/types";

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeRequired(value: string): string {
  return value.trim();
}

function normalizeOptional(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function logProfileError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Profile] ${context}`, error);
  }
}

export default function ProfilePageClient() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user?.id) {
        if (isMounted) {
          setProfile(null);
          setIsLoading(false);
          setErrorMessage("Session utilisateur introuvable.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const loadedProfile = await getOrCreateUserProfile();

        if (!isMounted) {
          return;
        }

        setProfile(loadedProfile);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logProfileError("Échec du chargement du profil Firestore.", error);
        setProfile(null);
        setErrorMessage("Impossible de charger le profil depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.id]);

  const sections = useMemo(() => {
    if (!profile) {
      return null;
    }

    return getProfileSections(profile);
  }, [profile]);

  function handleOpenModal() {
    if (isSaving || !profile) {
      return;
    }

    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  function handleSubmitModal(formData: ProfileModalFormData) {
    if (!user?.id || !profile || isSaving) {
      return;
    }

    const profileUpdate: UpdateUserProfileInput = {
      firstName: normalizeRequired(formData.firstName),
      lastName: normalizeRequired(formData.lastName),
      displayName: normalizeRequired(formData.displayName),
      businessName: normalizeOptional(formData.businessName),
      role: normalizeOptional(formData.role),
      specialty: normalizeOptional(formData.specialty),
      email: normalizeOptional(formData.email),
      phone: normalizeOptional(formData.phone),
      city: normalizeOptional(formData.city),
      country: normalizeOptional(formData.country),
      currency: formData.currency,
      bio: normalizeOptional(formData.bio),
    };

    const previousProfile = profile;
    const optimisticProfile: UserProfile = {
      ...profile,
      ...profileUpdate,
      userId: user.id,
      accountStatus: "firebase",
      updatedAt: new Date().toISOString(),
    };

    setProfile(optimisticProfile);
    setErrorMessage("");
    setIsSaving(true);

    void (async () => {
      try {
        const persistedProfile = await updateUserProfile(profileUpdate);
        setProfile(persistedProfile);
      } catch (error) {
        logProfileError("Échec de la sauvegarde du profil Firestore.", error);
        setProfile(previousProfile);
        setErrorMessage("Impossible d'enregistrer les modifications du profil.");
      } finally {
        setIsSaving(false);
      }
    })();
  }

  if (isLoading) {
    return <PageLoader variant="profile" title="Profil" description="Informations d'identité et d'activité professionnelle du compte utilisateur." />;
  }

  if (!profile || !sections) {
    return (
      <>
        <PageHeader
          title="Profil"
          description="Informations d'identité et d'activité professionnelle du compte utilisateur."
        />

        <div className="section-card">
          <div className="section-card__body">
            <div className="modal-error" role="alert" style={{ marginBottom: 0 }}>
              {errorMessage || "Impossible d'afficher le profil."}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Profil"
        description="Informations d'identité et d'activité professionnelle du compte utilisateur."
      />

      {isSaving && (
        <p
          style={{
            marginBottom: "12px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          Enregistrement du profil...
        </p>
      )}

      {!isSaving && errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      <ProfileHeader profile={profile} onEdit={handleOpenModal} />

      <div className="profile-sections-grid">
        <ProfileSectionCard
          title="Identité"
          description="Données de présentation personnelle et professionnelle."
          tone="identity"
        >
          {sections.identity.map((field) => (
            <ProfileField key={field.key} label={field.label} value={field.value} />
          ))}
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Coordonnées"
          description="Canaux de contact et localisation."
          tone="contact"
        >
          {sections.contact.map((field) => (
            <ProfileField key={field.key} label={field.label} value={field.value} />
          ))}
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Activité"
          description="Préférences métier et description de l'activité."
          tone="activity"
        >
          {sections.activity.map((field) => (
            <ProfileField key={field.key} label={field.label} value={field.value} />
          ))}
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Compte"
          description="Métadonnées techniques du compte et statut de stockage."
          tone="account"
        >
          {sections.account.map((field) => {
            if (field.key === "accountStatus") {
              return (
                <ProfileField
                  key={field.key}
                  label={field.label}
                  valueNode={<ProfileStatusBadge status={profile.accountStatus} />}
                />
              );
            }

            if (field.key === "createdAt" || field.key === "updatedAt") {
              return (
                <ProfileField
                  key={field.key}
                  label={field.label}
                  value={formatDateTime(field.value)}
                />
              );
            }

            return (
              <ProfileField
                key={field.key}
                label={field.label}
                value={field.value}
                monospace={field.key === "userId"}
              />
            );
          })}
        </ProfileSectionCard>
      </div>

      <ProfileModal
        isOpen={isModalOpen}
        profile={profile}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
      />
    </>
  );
}
