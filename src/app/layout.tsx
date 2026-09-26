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

export const viewport: Viewport = { themeColor: "#b8322a", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Gelan English Club",
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
        <main className="relative z-[2] flex-1">{children}</main>
        <SiteFooter />
        <SupportWidget />
        <CommandPalette />
        <XpToaster />
      </body>
    </html>
  );
}
