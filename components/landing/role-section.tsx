import { BookOpen, GraduationCap, Shield, UserCheck } from "lucide-react";
import { cn } from "@/lib/cn";

const roles = [
  {
    name: "Admin",
    icon: Shield,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    description: "Manages users, rooms, and system data",
    features: ["User management", "Room oversight", "System administration"],
  },
  {
    name: "Mentor",
    icon: GraduationCap,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    description: "Creates and leads study rooms",
    features: ["Create study rooms", "Lead discussions", "Manage activities"],
  },
  {
    name: "Moderator",
    icon: UserCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description: "Assists mentors during study sessions",
    features: ["Support sessions", "Monitor chat", "Help participants"],
  },
  {
    name: "Student",
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/10",
    description: "Joins rooms and participates in learning",
    features: ["Join with room code", "Ask questions", "Collaborate live"],
  },
];

export function RoleSection() {
  return (
    <section id="roles" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for Every Role
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            StudySpace gives each participant the tools they need to make every learning session productive.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <div
              key={role.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={cn("mb-5 inline-flex rounded-xl p-3", role.bg)}>
                <role.icon className={cn("h-6 w-6", role.color)} />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">{role.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>
              <ul className="mt-5 space-y-2">
                {role.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", role.bg)} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
