"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MessageSquare, PenTool, BarChart2, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const mockCards = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Ask questions in real-time",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: PenTool,
    title: "Whiteboard",
    description: "Draw and collaborate",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: BarChart2,
    title: "Polling",
    description: "Interactive polls",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Participants",
    description: "See who's online",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-6 inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          Collaborative Learning Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Make Learning More Interactive in One Collaborative Space
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          StudySpace helps mentors, moderators, and students collaborate through
          chat, digital whiteboard, polling, and interactive study room
          features.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Login
          </Link>
        </motion.div>

        {/* Visual mockup */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mx-auto mt-16 max-w-3xl"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {mockCards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
              >
                <div className={cn("rounded-lg p-2", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
                <span className="text-sm font-medium text-card-foreground">
                  {card.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {card.description}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
