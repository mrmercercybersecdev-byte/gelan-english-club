"use client";

import { useState } from "react";
import type { Question } from "@/lib/quizzes";
import TutorChat from "@/components/learn/TutorChat";
import EssayGrader from "@/components/learn/EssayGrader";
import Quiz from "@/components/learn/Quiz";

type T = {
  id: string;
  name: string;
  tutorMode: string;
  tutorIntro: string;
  essayPrompts: string[];
  minWords: number;
  questions: Question[];
};

export default function TrackTabs({ track }: { track: T }) {
  const tabs = [
    { id: "tutor", label: "🤖 AI Tutor" },
    ...(track.essayPrompts.length ? [{ id: "essay", label: "✍️ Writing Grader" }] : []),
    { id: "quiz", label: "⏱️ Timed Quiz" },
  ];
  const [tab, setTab] = useState("tutor");

  return (
    <div>
      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-ink text-white shadow" : "text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={tab === "tutor" ? "" : "hidden"}>
        <TutorChat mode={track.tutorMode} intro={track.tutorIntro} title={`${track.name} Tutor`} />
      </div>
      {tab === "essay" && <EssayGrader prompts={track.essayPrompts} minWords={track.minWords} />}
      {tab === "quiz" && <Quiz questions={track.questions} trackId={track.id} />}
    </div>
  );
}
