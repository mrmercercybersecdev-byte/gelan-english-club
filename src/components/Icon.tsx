import type { JSX, SVGProps } from "react";

export type IconName =
  | "announcement"
  | "arrow-up-right"
  | "award"
  | "book"
  | "calendar"
  | "check"
  | "chat"
  | "clock"
  | "close"
  | "game"
  | "globe"
  | "help"
  | "microphone"
  | "people"
  | "shield"
  | "sparkles"
  | "star"
  | "trophy"
  | "user"
  | "video";

const ICONS: Record<IconName, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  announcement: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  ),
  "arrow-up-right": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  ),
  award: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 14l-1.5 6 5-3 5 3-1.5-6" />
    </svg>
  ),
  book: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5V5.5" />
      <path d="M20 3v15.5" />
    </svg>
  ),
  calendar: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  check: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 12 4 4L19 2" />
    </svg>
  ),
  chat: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 18.5V7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5v6A2.5 2.5 0 0 1 15.5 16H9l-3 2.5Z" />
    </svg>
  ),
  clock: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  close: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  game: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="8" width="16" height="10" rx="3" />
      <path d="M8 12h3M9.5 10.5v3M15 12h.01M15 10.5h.01" />
    </svg>
  ),
  globe: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16" />
    </svg>
  ),
  help: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.7 2.7 0 0 1 4.9 1.5c0 2-2.1 2.4-2.7 4" />
      <circle cx="12" cy="17.1" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  microphone: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </svg>
  ),
  people: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
      <circle cx="10" cy="7" r="3" />
      <path d="M20 19v-1a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a4 4 0 0 1 0 7.74" />
    </svg>
  ),
  shield: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3 5 6v5c0 4.2 2.8 8 7 10 4.2-2 7-5.8 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.8-4.2" />
    </svg>
  ),
  sparkles: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 1.7 4.8L18 9.5l-4.3 1.7L12 16l-1.7-4.8L6 9.5l4.3-1.7L12 3Z" />
      <path d="m18.5 14 1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1 1-2.8Z" />
    </svg>
  ),
  star: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.7L12 0l-5.3 2.8 1-5.7L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  ),
  trophy: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4h8v2a4 4 0 0 1-8 0V4Z" />
      <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" />
      <path d="M9 18h6v2H9zM8 20h8" />
      <path d="M6 8H4a2 2 0 0 0 2 2M18 8h2a2 2 0 0 1-2 2" />
    </svg>
  ),
  user: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  ),
  video: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="m15 10 6-3v10l-6-3" />
    </svg>
  ),
};

export function toIconName(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  const map: Record<string, IconName> = {
    announcement: "announcement",
    news: "announcement",
    book: "book",
    calendar: "calendar",
    clock: "clock",
    trophy: "trophy",
    user: "user",
    people: "people",
    help: "help",
    video: "video",
    microphone: "microphone",
    sparkles: "sparkles",
    award: "award",
    shield: "shield",
    check: "check",
    chat: "chat",
    game: "game",
    globe: "globe",
    star: "star",
  };
  return map[normalized] ?? "sparkles";
}

export default function Icon({ name, size = 18, className, ...props }: { name: IconName | string; size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  const iconName = toIconName(name);
  const Svg = ICONS[iconName] ?? ICONS.sparkles;
  return <Svg width={size} height={size} className={className} {...props} />;
}
