import Link from "next/link";
import type { Metadata } from "next";
import { TRACKS } from "@/lib/quizzes";
import { aiEnabled } from "@/lib/ai";
import { Reveal, TiltCard } from "@/components/fx/Effects";
import DnaHelix from "@/components/fx/DnaHelix";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI Learning Lab" };

export default function LearnPage() {
  const ai = aiEnabled();
  return (
    <div>
      <section className="aurora-bg relative overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <span className={`h-2 w-2 rounded-full ${ai ? "bg-emerald-400" : "bg-gold"}`} />
              {ai ? "GPT-powered tutors online" : "Built-in tutor engine active"}
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold md:text-6xl">AI Learning <span className="text-gradient">Lab</span></h1>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Personal tutors for IELTS, SAT, TOEFL and everyday English. Chat with an examiner, get instant essay band
              scores, and race the clock in timed quizzes — every answer earns XP.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {["Mock speaking examiner", "Essay band estimator", "Grammar corrector", "Timed quizzes", "Strategy coach"].map((t) => (
                <span key={t} className="glass rounded-full px-3 py-1.5">{t}</span>
              ))}
            </div>
          </div>
          <div className="h-72 md:h-80">
            <DnaHelix colorA="#60a5fa" colorB="#f472b6" letters="IELTSSATTOEFLGRAMMAR" horizontal nodes={24} turns={2} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t, i) => (
            <Reveal key={t.id} delay={i * 80}>
              <TiltCard className="h-full rounded-3xl">
                <Link href={`/learn/${t.id}`} className={`group relative block h-full overflow-hidden rounded-3xl bg-gradient-to-br ${t.gradient} p-7 text-white shadow-lg`}>
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 transition group-hover:scale-150" />
                  <span className="relative text-5xl">{t.icon}</span>
                  <h2 className="relative mt-5 font-display text-3xl font-bold">{t.name}</h2>
                  <p className="relative mt-2 text-white/85">{t.tagline}</p>
                  <div className="relative mt-6 flex gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white/20 px-3 py-1">🤖 Tutor</span>
                    {t.essayPrompts && <span className="rounded-full bg-white/20 px-3 py-1">✍️ Writing</span>}
                    <span className="rounded-full bg-white/20 px-3 py-1">⏱️ {t.questions.length} Qs</span>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
          <Reveal delay={500}>
            <Link href="/speak" className="group flex h-full flex-col justify-between rounded-3xl bg-ink p-7 text-white shadow-lg">
              <div>
                <span className="text-5xl">🎙️</span>
                <h2 className="mt-5 font-display text-3xl font-bold">Speaking Studio</h2>
                <p className="mt-2 text-white/70">Voice conversations & pronunciation scoring with your microphone.</p>
              </div>
              <div className="mt-6 flex h-10 items-center gap-1">
                {Array.from({ length: 24 }).map((_, k) => (
                  <span key={k} className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-brand to-gold" style={{ height: `${20 + ((k * 37) % 80)}%`, animationDelay: `${k * 0.07}s` }} />
                ))}
              </div>
            </Link>
          </Reveal>
        </div>
        {!ai && (
          <p className="mt-10 rounded-2xl bg-white p-5 text-sm text-muted ring-1 ring-black/5">
            💡 <strong className="text-ink">Tip for organisers:</strong> set <code>OPENAI_API_KEY</code> (and optionally <code>OPENAI_MODEL</code> /{" "}
            <code>OPENAI_BASE_URL</code>) to upgrade the tutors to a full large language model. Without it, the built-in engine
            still grades essays, corrects grammar and runs mock exams.
          </p>
        )}
      </section>
    </div>
  );
}
