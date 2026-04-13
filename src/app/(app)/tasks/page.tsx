import type { Metadata } from "next";
import TasksBoard from "@/components/tasks/TasksBoard";

export const metadata: Metadata = { title: "Tâches" };

export default function TasksPage() {
  return <TasksBoard />;
}
