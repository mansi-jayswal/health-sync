import Link from "next/link";
import Image from "next/image";
import {
  Users,
  FileImage,
  ClipboardList,
  Shield,
  Stethoscope,
  Building2,
  Upload,
  FileText,
  ArrowRight,
} from "lucide-react";
import { ContentContainer } from "@/components/shared/content-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav: logo left, Login + Sign up right */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <ContentContainer variant="wide" className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-foreground"
          >
            HealthScan
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher />
            <Link href={ROUTES.SIGN_IN}>
              <Button variant="ghost" size="sm" className="font-medium">
                Login
              </Button>
            </Link>
            <Link href={ROUTES.SIGN_UP}>
              <Button size="sm">Sign up</Button>
            </Link>
          </nav>
        </ContentContainer>
      </header>

      <main className="flex-1">
        {/* Hero: image left, copy + illustration right */}
        <section className="py-10 sm:py-14 md:py-16 lg:py-20">
          <ContentContainer variant="wide">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:gap-12 xl:gap-16 lg:items-center">
              {/* Left: healthcare image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted shadow-lg sm:aspect-[3/4] lg:aspect-[4/5]">
                <Image
                  src="/landing-page-image.avif"
                  alt="Healthcare professional with patient care"
                  fill
                  className="object-cover object-center rounded-2xl"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                />
              </div>

              {/* Right: about copy + illustration */}
              <div className="flex flex-col justify-center space-y-6 lg:space-y-8">
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
                    About HealthScan
                  </h1>
                  <span
                    className="mt-2 inline-block h-1.5 w-24 rounded-full bg-primary/80"
                    aria-hidden
                  />
                </div>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  HealthScan helps your clinic and radiologists work together in one place.
                  Upload imaging studies, keep everything organized, and get clear reports—so
                  you can focus on what matters: patient care.
                </p>


                {/* Feature cards + illustration */}
                <div className="grid gap-4 pt-4 sm:grid-cols-2">
                  <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="absolute -right-6 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                    <h3 className="relative text-base font-semibold text-foreground">
                      Stay on top of your studies
                    </h3>
                    <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      One place for patients, scans, and reports. Simple for staff, secure
                      for your data.
                    </p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/50 shadow-sm">
                    <div className="relative h-28 w-full sm:h-32">
                      <Image
                        src="/app-illustration.jpg"
                        alt="Healthcare app overview"
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-foreground">
                        Built for small clinics
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        No heavy IT. Invite your team, upload scans, and get reports
                        without the hassle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContentContainer>
        </section>

        {/* What we serve – main features */}
        <section className="border-t border-border/60 bg-muted/30 py-14 sm:py-16">
          <ContentContainer variant="wide">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                What we serve
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                A simple imaging workflow for small clinics: from patient records to
                radiologist reports, all in one place.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "Patient management",
                  desc: "Create and manage patient records. Link studies to patients and keep everything organized.",
                },
                {
                  icon: FileImage,
                  title: "Imaging studies",
                  desc: "Organize scans into studies with types and status. Assign studies to radiologists and track progress.",
                },
                {
                  icon: Upload,
                  title: "Upload & view scans",
                  desc: "Upload scan images securely. View them in the browser with zoom and fullscreen—no extra software.",
                },
                {
                  icon: FileText,
                  title: "Radiology reports",
                  desc: "Radiologists create and edit reports. Clinic staff view completed reports with a clear audit trail.",
                },
                {
                  icon: Shield,
                  title: "Role-based access",
                  desc: "Clinic admins manage patients and uploads. Radiologists see assigned studies and reports only.",
                },
                {
                  icon: Building2,
                  title: "Built for small clinics",
                  desc: "No enterprise complexity. Get started quickly with secure, cloud-based storage and collaboration.",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="border-border/70 bg-card shadow-sm transition hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-semibold text-foreground">
                      {item.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ContentContainer>
        </section>

        {/* Who it's for */}
        <section className="border-t border-border/60 py-14 sm:py-16">
          <ContentContainer variant="wide">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Who it's for
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                HealthScan supports both clinic staff and radiologists with the right
                tools for each role.
              </p>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                    Clinic staff & admins
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your imaging workflow from one dashboard.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Create and manage patients
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Upload and organize scan images
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Create studies and assign to radiologists
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      View studies and completed reports
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                    Radiologists
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Focus on your assigned studies and reporting.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      View your assigned studies only
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      View scan images with zoom and fullscreen
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Create and edit diagnostic reports
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Track status so the clinic stays in sync
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ContentContainer>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-muted/30 py-14 sm:py-16">
          <ContentContainer variant="wide">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                How it works
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Get from sign-up to first report in a few simple steps.
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-4">
              {[
                { step: 1, title: "Sign up & invite your team", desc: "Create your account and invite radiologists. Each person gets the right access." },
                { step: 2, title: "Add patients & studies", desc: "Create patient records and imaging studies. Assign studies to radiologists." },
                { step: 3, title: "Upload scan images", desc: "Upload scans to each study. View them in the browser when you need to." },
                { step: 4, title: "Get reports", desc: "Radiologists complete reports. You see them in the dashboard with full history." },
              ].map((item, i) => (
                <div key={item.step} className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.desc}</p>
                  {i < 3 && (
                    <ArrowRight className="mt-4 hidden h-5 w-5 shrink-0 text-muted-foreground/50 md:block" />
                  )}
                </div>
              ))}
            </div>
          </ContentContainer>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 py-14 sm:py-16">
          <ContentContainer variant="wide">
            <div className="rounded-2xl border border-border/70 bg-card px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ready to simplify your imaging workflow?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Join clinics that keep patients, studies, and reports in one secure place.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href={ROUTES.SIGN_UP}>
                  <Button size="lg">Get started</Button>
                </Link>
                <Link href={ROUTES.SIGN_IN}>
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </ContentContainer>
        </section>
      </main>

      {/* Basic footer */}
      <footer className="mt-auto border-t border-border/60 bg-background py-6">
        <ContentContainer variant="wide">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} HealthScan. All rights reserved.
          </p>
        </ContentContainer>
      </footer>
    </div>
  );
}
