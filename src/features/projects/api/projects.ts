import { apiRequest } from "@/lib/api-client";
import type { Project, UpsertProjectInput } from "@/features/projects/types";

interface ProjectsListResponse {
  items: Project[];
}

interface ProjectItemResponse {
  item: Project;
}

export async function listUserProjects(): Promise<Project[]> {
  const response = await apiRequest<ProjectsListResponse>("/api/v1/projects", {
    method: "GET",
  });

  return response.items;
}

export async function createProject(data: UpsertProjectInput): Promise<Project> {
  const response = await apiRequest<ProjectItemResponse>("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response.item;
}

export async function updateProject(
  projectId: string,
  data: Partial<UpsertProjectInput>
): Promise<Project> {
  const normalizedProjectId = projectId.trim();

  if (!normalizedProjectId) {
    throw new Error("Projet invalide: id manquant.");
  }

  const response = await apiRequest<ProjectItemResponse>(
    `/api/v1/projects/${encodeURIComponent(normalizedProjectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.item;
}

export async function deleteProject(projectId: string): Promise<void> {
  const normalizedProjectId = projectId.trim();

  if (!normalizedProjectId) {
    throw new Error("Projet invalide: id manquant.");
  }

  await apiRequest<{ success: boolean }>(
    `/api/v1/projects/${encodeURIComponent(normalizedProjectId)}`,
    {
      method: "DELETE",
    }
  );
}
