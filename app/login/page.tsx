import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, getDashboardPath } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/layout/logo";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Logo size={36} textClassName="text-2xl" priority />
      </Link>

      <LoginForm />
    </div>
  );
}
