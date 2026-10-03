import Link from "next/link";
import type { Metadata } from "next";
import { Reveal, Marquee, Counter } from "@/components/fx/Effects";
import DnaHelix from "@/components/fx/DnaHelix";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "AI Learning Lab — Coming Soon" };

export default function ComingSoonPage() {
  const features = [
    { icon: "sparkles", title: "Real-time AI Tutors", desc: "IELTS, SAT & TOEFL speaking coaches powered by Gemini & Groq" },
    { icon: "check", title: "Essay Band Scoring", desc: "Get instant IELTS-style band scores with line-by-line feedback" },
    { icon: "microphone", title: "Pronunciation Scoring", desc: "Speak into your mic and hear how close you are to native speakers" },
    { icon: "zap", title: "Timed Quizzes", desc: "Race against the clock and earn XP for every correct answer" },
    { icon: "book", title: "Grammar Corrections", desc: "Real-time feedback on your writing with explanations you'll remember" },
    { icon: "lightbulb", title: "Learning Paths", desc: "Personalized practice sequences tailored to your English level" },
  ];

  const phases = [
    { phase: "Phase 1", text: "AI Lab infrastructure & provider integration", color: "from-rose-400 to-red-600" },
    { phase: "Phase 2", text: "IELTS speaking & writing modules", color: "from-amber-400 to-orange-600" },
    { phase: "Phase 3", text: "SAT & TOEFL specialized tracks", color: "from-violet-400 to-purple-700" },
    { phase: "Phase 4", text: "Grammar & conversation daily practice", color: "from-cyan-400 to-blue-700" },
    { phase: "Phase 5", text: "Personalized learning dashboards & analytics", color: "from-emerald-400 to-teal-600" },
  ];

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="aurora-bg relative -mt-px overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-5 sm:py-24 md:grid-cols-2">
          <div>
            <Reveal>
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </span>
                Launching very soon
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.02] sm:text-5xl md:text-6xl">
                AI Learning Lab — Power Your English
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">
                Your personal team of AI tutors for IELTS, SAT, TOEFL and everyday English. Mock exams, instant feedback, real pronunciation scoring, and timed quizzes — all powered by the latest AI models.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/events" className="btn-primary !px-6 !py-3.5 shadow-lg shadow-brand/40 text-center sm:w-auto">Join the waitlist</Link>
                <Link href="/" className="btn-ghost text-center sm:w-auto"><Icon name="arrow-left" size={16} className="inline mr-2" /> Back to home</Link>
              </div>
            </Reveal>
          </div>
          <div className="relative h-56 sm:h-72 md:h-80">
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-white/10" />
            <div className="absolute inset-12 animate-spin-slow rounded-full border border-white/5 [animation-direction:reverse]" />
            <DnaHelix className="absolute inset-0" />
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">What you'll be able to do</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand to-gold text-white">
                  <Icon name={f.icon as any} size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ ROADMAP ============ */}
      <section className="relative bg-ink text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Development roadmap</h2>
            <p className="mt-3 text-center text-white/60">Here's where we're heading, phase by phase.</p>
          </Reveal>
          <div className="mt-12 space-y-4 sm:space-y-6">
            {phases.map((p, i) => (
              <Reveal key={p.phase} delay={i * 80}>
                <div className="flex gap-4 sm:gap-6">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${p.color} font-display text-lg font-bold`}>
                    {i + 1}
                  </div>
                  <div className="flex flex-1 items-center rounded-2xl bg-white/5 p-4 sm:p-5 ring-1 ring-white/10">
                    <div>
                      <p className="font-display text-lg font-bold">{p.phase}</p>
                      <p className="mt-1 text-sm text-white/70">{p.text}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: "AI Models Ready", value: 2, suffix: "" },
            { label: "Learning Tracks Planned", value: 5, suffix: "" },
            { label: "Club Members Waiting", value: 320, suffix: "+" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="rounded-2xl bg-gradient-to-br from-brand/10 to-gold/10 p-6 text-center ring-1 ring-brand/20">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted">{s.label}</p>
                <p className="mt-2 font-display text-4xl font-bold"><Counter to={s.value} suffix={s.suffix} /></p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative mx-auto max-w-3xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="rounded-3xl bg-gradient-to-r from-brand to-gold p-6 text-center text-white sm:p-10">
          <Reveal>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Want to be the first to know?</h2>
            <p className="mt-2 text-white/85">Get early access to AI Lab features and exclusive tutorials.</p>
            <Link href="/events" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand transition hover:shadow-lg hover:shadow-brand/40">
              Join the waitlist
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
