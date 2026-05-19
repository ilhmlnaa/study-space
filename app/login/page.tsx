import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BookOpen className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">StudySpace</span>
      </Link>

      <LoginForm />
    </div>
  );
}
