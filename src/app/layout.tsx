import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CommandPalette from "@/components/CommandPalette";
import XpToaster from "@/components/XpToaster";
import LiveBanner from "@/components/LiveBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import SupportWidget from "@/components/SupportWidget";
import { ScrollProgress, CursorGlow } from "@/components/fx/Effects";
import { getCurrentUser, toPublic } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import type { Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";
import { isAdminHostname } from "@/lib/admin-domain";
import SiteContentBlocks from "@/components/SiteContentBlocks";

export const viewport: Viewport = { themeColor: "#147d75", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Gelan English Club",
  icons: {
    icon: [{ url: "/images/gelan-english-club-logo.jpeg", sizes: "1248x1248", type: "image/jpeg" }],
    apple: [{ url: "/images/gelan-english-club-logo.jpeg", sizes: "1248x1248", type: "image/jpeg" }],
  },
  openGraph: {
    type: "website",
    siteName: "Gelan English Club",
    title: "Gelan English Club — Speak English with confidence",
    description: "Live rooms, AI tutors for IELTS/SAT/TOEFL, study groups, word games, verified submissions and weekly meetups.",
    images: [{ url: "/images/hero.jpg", width: 1200, height: 900, alt: "Gelan English Club members" }],
  },
  twitter: { card: "summary_large_image", images: ["/images/hero.jpg"] },
  title: {
    default: "Gelan English Club — Speak English with confidence",
    template: "%s · Gelan English Club",
  },
  description:
    "A community English club with live video rooms, chat channels, an AI learning lab for IELTS, SAT & TOEFL, a voice speaking studio, leaderboards and weekly meetups.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  if (isAdminHostname(requestHeaders.get("host"))) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-cream text-ink antialiased">
          <main>{children}</main>
        </body>
      </html>
    );
  }
  const pagePath = requestHeaders.get("x-site-pathname") || "/";

  let user = null;
  try {
    const u = await getCurrentUser();
    user = u ? toPublic(u) : null;
  } catch {
    user = null;
  }
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-cream text-ink antialiased">
        <ScrollProgress />
        <CursorGlow />
        <LiveBanner />
        <AnnouncementBanner />
        <SiteHeader user={user} />
        <main className="relative z-[2] flex-1">
          <SiteContentBlocks pagePath={pagePath} placement="top" />
          {children}
          <SiteContentBlocks pagePath={pagePath} placement="bottom" />
        </main>
        <SiteFooter />
        <SupportWidget />
        <CommandPalette />
        <XpToaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
