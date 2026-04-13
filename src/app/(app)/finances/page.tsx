import type { Metadata } from "next";
import FinancesBoard from "@/components/finances/FinancesBoard";

export const metadata: Metadata = { title: "Finances" };

export default function FinancesPage() {
  return <FinancesBoard />;
}
