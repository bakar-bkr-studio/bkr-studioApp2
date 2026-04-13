import type { Metadata } from "next";
import ProjectDetailsPage from "@/components/projects/ProjectDetailsPage";

export const metadata: Metadata = { title: "Détail projet" };

interface ProjectDetailsRouteProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailsRoute({ params }: ProjectDetailsRouteProps) {
  const { projectId } = await params;
  return <ProjectDetailsPage projectId={projectId} />;
}
