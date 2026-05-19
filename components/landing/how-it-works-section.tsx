import { LogIn, Users, Zap } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: LogIn,
    title: "Create a Room",
    description: "Mentor creates a study room and gets a unique room code",
  },
  {
    number: "2",
    icon: Users,
    title: "Join the Room",
    description: "Students join using the room code shared by the mentor",
  },
  {
    number: "3",
    icon: Zap,
    title: "Start Collaborating",
    description: "Everyone collaborates through chat, whiteboard, polling, and announcements",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/40 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start a collaborative study session in minutes with a simple room-based flow.
          </p>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16.5%] right-[16.5%] top-14 hidden h-px bg-border md:block" />
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.number}
                </div>
                <step.icon className="h-9 w-9 text-primary" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
