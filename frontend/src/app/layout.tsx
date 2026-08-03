import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { AppProviders } from "@/components/AppProviders";
import { getSettings } from "@backend/services/settings.service";
import { readFromDatabase } from "@backend/prisma";
import { computeBrandTheme } from "@/lib/theme";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
