import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function MentorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MENTOR") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <AppSidebar
        role="MENTOR"
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />
      <main className="flex-1 overflow-y-auto p-6 pt-16 md:pt-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
