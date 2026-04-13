import { Suspense } from "react";
import PublicLoginPage from "@/components/public/LoginPage";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <PublicLoginPage />
    </Suspense>
  );
}
