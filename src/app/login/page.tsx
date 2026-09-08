import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh bg-muted px-4 py-6 sm:px-6 sm:py-8 md:p-10">
      <div className="mx-auto my-auto w-full max-w-md">
        <LoginForm mode="login" />
      </div>
    </div>
  );
}
