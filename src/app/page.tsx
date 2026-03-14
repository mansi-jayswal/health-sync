import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ContentContainer } from "@/components/shared/content-container";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

const illustration = (
  <div className="relative mx-auto h-64 w-full max-w-3xl overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/20 via-primary/10 to-purple-500/10 shadow-lg">
    <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-sky-400/30 blur-3xl" />
    <div className="absolute -right-12 top-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
    <svg
      viewBox="0 0 400 240"
      className="relative z-10 h-full w-full"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="40" y="40" width="200" height="140" rx="16" fill="url(#grad)" opacity="0.18" />
      <rect x="70" y="60" width="160" height="110" rx="14" className="stroke-sky-500/60" />
      <rect x="240" y="70" width="110" height="110" rx="18" className="stroke-purple-500/60" />
      <path d="M95 110h110" className="stroke-sky-500/70" />
      <path d="M95 130h80" className="stroke-sky-500/50" />
      <circle cx="295" cy="115" r="26" className="stroke-purple-500/80" />
      <path d="M295 95v40M275 115h40" className="stroke-purple-500/80" />
      <circle cx="140" cy="90" r="12" className="stroke-sky-500/80" />
      <path d="M40 170c60 30 140 30 210 0" className="stroke-sky-500/30" />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
  </div>
);

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <ContentContainer variant="wide" className="flex items-center justify-between py-4">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            HealthScan
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/sign-in">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </ContentContainer>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <ContentContainer variant="wide" className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Secure imaging workflow
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Simple, secure imaging management for small clinics
              </h1>
              <p className="text-lg text-muted-foreground">
                Upload scans, organize studies, and collaborate with radiologists in one
                lightweight, role-aware dashboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={user ? "/dashboard" : "/auth/sign-up"}>
                  <Button size="lg">{user ? "Open dashboard" : "Get started"}</Button>
                </Link>
                <Link href="/auth/sign-in">
                  <Button size="lg" variant="outline">
                    Login
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Role-based access</span>
                <span>•</span>
                <span>Private scan storage</span>
                <span>•</span>
                <span>Reports with audit trail</span>
              </div>
            </div>
            <div className="animate-[pulse_12s_ease-in-out_infinite]">{illustration}</div>
          </ContentContainer>
        </section>

        <section className="border-t border-border/60 bg-muted/30 py-14">
          <ContentContainer variant="wide">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Patient & Study Hub",
                  desc: "Create patients, link studies, and keep assignments in sync.",
                },
                {
                  title: "Radiologist Worklist",
                  desc: "Assigned-only queue with status filters and report progress.",
                },
                {
                  title: "Scan Viewer",
                  desc: "Zoom, pan, fullscreen on JPG/PNG scans with signed URLs.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/70 bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </ContentContainer>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background py-6">
        <ContentContainer variant="wide" className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HealthScan
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/auth/sign-in" className="hover:text-foreground">
              Login
            </Link>
            <Link href="/auth/sign-up" className="hover:text-foreground">
              Sign up
            </Link>
          </div>
        </ContentContainer>
      </footer>
    </div>
  );
}
