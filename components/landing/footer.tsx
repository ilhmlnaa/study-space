import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-md">
            <Logo size={24} textClassName="text-lg" />
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A collaborative learning platform built for mentors, moderators,
              and students to teach and learn together in real time.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2025 StudySpace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
