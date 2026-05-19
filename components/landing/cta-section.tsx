import Link from "next/link";

export function CTASection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 py-16 text-center shadow-xl sm:px-12 sm:py-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Create a More Interactive Learning Session?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join StudySpace today and transform the way you teach and learn.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
