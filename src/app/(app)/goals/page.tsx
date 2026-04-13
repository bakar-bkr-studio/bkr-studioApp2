import type { Metadata } from "next";
import GoalsBoard from "@/components/goals/GoalsBoard";

export const metadata: Metadata = { title: "Objectifs" };

export default function GoalsPage() {
  return <GoalsBoard />;
}
