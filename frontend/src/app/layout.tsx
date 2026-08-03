import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { AppProviders } from "@/components/AppProviders";
import { getSettings } from "@backend/services/settings.service";
import { readFromDatabase } from "@backend/prisma";
import { computeBrandTheme } from "@/lib/theme";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Every page in this app is per-request/authenticated (live DB reads, session
// cookies) — none of it should ever be statically prerendered at build time.
// Route segment config only takes effect when exported directly from a
// page/layout/route file (not from an imported component module — several
// screens/*/Screen.tsx files export `dynamic = "force-dynamic"` themselves,
// but that's inert, Next.js never reads it there). Setting it once here on
// the root layout cascades to every route, which is what was actually
// missing and why Vercel's build tried to prerender ~100 pages against a
// database it doesn't have (no DATABASE_URL at build time) and failed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ScholarSphere Pro",
  description: "School management system for Ghanaian schools",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The school's brand colour (Settings > Branding) drives the real app theme —
  // read live on every request so an admin's change takes effect immediately,
  // with a safe default if the database is unreachable (e.g. during a cold build).
  const settings = await readFromDatabase(() => getSettings(), null);
  const primaryColor = (settings?.extra as Record<string, unknown> | null)?.primaryColor as string | undefined;
  const theme = computeBrandTheme(primaryColor);

  return (
    <html lang="en">
      <body className={inter.variable}>
        <style>{`:root {
          --clr-app-accent: ${theme.accent};
          --clr-app-accent-hover: ${theme.accentHover};
          --clr-app-accent-soft: ${theme.accentSoft};
        }`}</style>
        <PwaRegister />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
