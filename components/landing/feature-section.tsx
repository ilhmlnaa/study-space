import { BarChart2, BookOpen, Hand, MessageSquare, PenTool, Shield } from "lucide-react";
import { FeatureCard } from "@/components/landing/feature-card";

const features = [
  {
    icon: BookOpen,
    title: "Collaborative Study Room",
    description: "Create or join study rooms with a unique code",
  },
  {
    icon: PenTool,
    title: "Excalidraw Whiteboard",
    description: "Draw, annotate, and collaborate on a shared whiteboard",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Real-time messaging with role badges and history",
  },
  {
    icon: BarChart2,
    title: "Interactive Polling",
    description: "Create polls and see results update in real-time",
  },
  {
    icon: Hand,
    title: "Raise Hand",
    description: "Students can raise their hand to ask questions",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Admin, Mentor, Moderator, and Student roles",
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need for Interactive Learning
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Bring communication, collaboration, and classroom management into one focused learning workspace.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={<feature.icon className="h-6 w-6" />}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
