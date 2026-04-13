"use client";

import { useEffect, useState } from "react";
import { updateUserDashboardData } from "@/features/profile/api/profile";

interface DashboardNotesProps {
  userId: string | null;
  initialNotes: string | null;
  profileErrorMessage?: string;
}

export default function DashboardNotes({
  userId,
  initialNotes,
  profileErrorMessage,
}: DashboardNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);

  useEffect(() => {
    if (profileErrorMessage) {
      setStatusMessage(profileErrorMessage);
    }
  }, [profileErrorMessage]);

  async function handleSave() {
    if (!userId || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      const dashboardNotes = notes.trim() ? notes : null;
      const updated = await updateUserDashboardData({
        dashboardNotes,
      });

      setNotes(updated.dashboardNotes ?? "");
      setStatusMessage("Notes sauvegardées.");
    } catch {
      setStatusMessage("Échec de la sauvegarde des notes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="dashboard-notes">
      <textarea
        className="dashboard-notes__textarea"
        placeholder="Ajoutez vos notes ici..."
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        disabled={!userId || isSaving}
      />
      <div className="dashboard-notes__footer">
        <span className="dashboard-notes__status">{statusMessage}</span>
        <div className="dashboard-notes__actions">
          <button
            type="button"
            className="dashboard-notes__clear"
            onClick={() => setNotes("")}
            disabled={!userId || isSaving || notes.length === 0}
          >
            Effacer
          </button>
          <button
            type="button"
            className="dashboard-notes__save"
            onClick={handleSave}
            disabled={!userId || isSaving}
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
