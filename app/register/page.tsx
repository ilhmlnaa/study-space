import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, getDashboardPath } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/layout/logo";

export default async function RegisterPage() {
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

      <RegisterForm />
    </div>
  );
}
