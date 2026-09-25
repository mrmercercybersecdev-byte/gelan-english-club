import type { Metadata } from "next";
import JoinForm from "./JoinForm";

export const metadata: Metadata = { title: "Join the club" };

const PERKS = [
  ["🆓", "Free membership", "No fees, no contracts — ever. We're run by volunteers."],
  ["📅", "Priority RSVPs", "Members hear about new events first and can reserve spots."],
  ["📖", "Welcome pack", "Conversation starters, useful phrases and a guide to your first visit."],
  ["🤝", "Buddy system", "Get paired with a friendly member for your first few meetups."],
];

export default function JoinPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1fr_1.15fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Membership</p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-tight">Join the Gelan English Club community</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Whether you&apos;re just starting out or polishing your advanced English, there&apos;s a place for you
          here. Tell us a little about yourself and we&apos;ll match you with the right activities.
        </p>
        <ul className="mt-10 space-y-5">
          {PERKS.map(([icon, title, text]) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-black/5">
                {icon}
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 md:p-9">
        <JoinForm />
      </div>
    </div>
  );
}
