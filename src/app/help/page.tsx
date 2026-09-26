import Link from "next/link";
import Icon from "@/components/Icon";

const HELP_TOPICS = [
  {
    title: "Getting started",
    description: "How to create your account, join a live room, and earn your first XP milestones.",
    icon: "sparkles" as const,
    href: "/login",
  },
  {
    title: "Live sessions",
    description: "Tips for your first Speaking Studio session, video room etiquette, and healthy practice habits.",
    icon: "video" as const,
    href: "/meet",
  },
  {
    title: "Study plans",
    description: "Choose the right AI Lab track, reading practice, and weekly challenge schedule for you.",
    icon: "book" as const,
    href: "/learn",
  },
  {
    title: "Community support",
    description: "Reach out, ask questions in chat, and connect with facilitators and fellow learners.",
    icon: "people" as const,
    href: "/contact",
  },
];

const FAQ = [
  {
    q: "Do I need to pay to join?",
    a: "No. Most of the club is free to join. You can explore the AI lab, chat rooms, and community events without a paid plan.",
  },
  {
    q: "Can I attend as a beginner?",
    a: "Absolutely. We run beginner-friendly sessions and the Speaking Studio is designed to help anyone build confidence gradually.",
  },
  {
    q: "How do I earn XP?",
    a: "Complete quizzes, contribute to chat, join events, submit work, and keep your daily streak alive. XP motivates progress and unlocks rankings.",
  },
  {
    q: "What if I need extra help?",
    a: "Use the contact page or join the community chat channels. Facilitators and club members are happy to guide newer members.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <section className="rounded-[2rem] bg-gradient-to-br from-ink via-ink to-brand/80 p-8 text-white shadow-2xl md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Support</p>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-6xl">Help is here</h1>
        <p className="mt-4 max-w-2xl text-white/75">
          Whether you are brand new or already active in the club, we have a place for you to learn quickly and get support.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn-primary !px-6 !py-3.5">
            Create account
          </Link>
          <Link href="/contact" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white hover:bg-white/15">
            <Icon name="chat" size={16} /> Contact us
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {HELP_TOPICS.map((topic) => (
          <Link key={topic.title} href={topic.href} className="group rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Icon name={topic.icon} size={22} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">{topic.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{topic.description}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
              Explore <Icon name="arrow-up-right" size={14} />
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Most common questions</h2>
          <div className="mt-6 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl bg-paper p-4">
                <p className="font-semibold">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-paper p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand">Need direct help?</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Talk to the club</h2>
          <ul className="mt-6 space-y-4 text-sm text-muted">
            <li className="flex items-start gap-3"><Icon name="chat" size={18} className="mt-0.5 text-brand" />Message us via the community and contact pages.</li>
            <li className="flex items-start gap-3"><Icon name="clock" size={18} className="mt-0.5 text-brand" />Most replies arrive within a few hours during active club times.</li>
            <li className="flex items-start gap-3"><Icon name="shield" size={18} className="mt-0.5 text-brand" />We keep support friendly, prompt, and respectful for all members.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary !px-5 !py-3 text-sm">Send message</Link>
            <Link href="/about" className="btn-ghost !px-5 !py-3 text-sm">Learn more</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
