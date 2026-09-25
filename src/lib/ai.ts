/* AI layer: uses an OpenAI-compatible API when OPENAI_API_KEY is set,
   otherwise falls back to a built-in rule-based tutor engine. */

export type ChatMsg = { role: "user" | "assistant"; content: string };

export function aiEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function llm(system: string, messages: ChatMsg[], maxTokens = 600): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: "system", content: system }, ...messages.slice(-12)],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Grammar checker                                                     */
/* ------------------------------------------------------------------ */
export type Correction = { found: string; suggestion: string; why: string };

const RULES: { re: RegExp; fix: string | ((m: string, ...g: string[]) => string); why: string }[] = [
  { re: /\bi\b(?=[\s',.!?])/g, fix: "I", why: "The pronoun 'I' is always capitalised." },
  { re: /\ba (?=[aeiou]\w)/gi, fix: (m) => (m[0] === "A" ? "An " : "an "), why: "Use 'an' before a vowel sound." },
  { re: /\bmore (better|worse|bigger|smaller|easier|harder)\b/gi, fix: (_m, w) => w, why: "Don't use 'more' with a comparative adjective." },
  { re: /\binformations\b/gi, fix: "information", why: "'Information' is uncountable." },
  { re: /\badvices\b/gi, fix: "advice", why: "'Advice' is uncountable." },
  { re: /\bpeoples\b/gi, fix: "people", why: "'People' is already plural." },
  { re: /\bdiscuss about\b/gi, fix: "discuss", why: "'Discuss' doesn't take 'about'." },
  { re: /\bin the other hand\b/gi, fix: "on the other hand", why: "The phrase is 'on the other hand'." },
  { re: /\bdepend of\b/gi, fix: "depend on", why: "We say 'depend on'." },
  { re: /\b(he|she|it) (don't)\b/gi, fix: (_m, p) => `${p} doesn't`, why: "Third person singular uses 'doesn't'." },
  { re: /\b(he|she|it) (have)\b/gi, fix: (_m, p) => `${p} has`, why: "Third person singular uses 'has'." },
  { re: /\b(I|you|we|they) (was)\b/g, fix: (_m, p) => `${p} were`, why: "Use 'were' with I/you/we/they (except 'I was')." },
  { re: /\bI were\b/g, fix: "I was", why: "In the past simple, use 'I was' (except in conditionals)." },
  { re: /\bexplain me\b/gi, fix: "explain to me", why: "We 'explain something to someone'." },
  { re: /\bsince (\d+) (years|months|days|weeks)\b/gi, fix: (_m, n, u) => `for ${n} ${u}`, why: "Use 'for' with a period of time, 'since' with a point in time." },
  { re: /\bmake a photo\b/gi, fix: "take a photo", why: "Collocation: 'take a photo'." },
  { re: /\bdo a mistake\b/gi, fix: "make a mistake", why: "Collocation: 'make a mistake'." },
  { re: /\bI am agree\b/gi, fix: "I agree", why: "'Agree' is a verb — no 'am' needed." },
  { re: /\bvery much (\w+)\b(?= than)/gi, fix: (_m, w) => `much ${w}`, why: "Use 'much' (not 'very much') before comparatives." },
  { re: /\bcould of\b/gi, fix: "could have", why: "'Could of' is a mishearing of 'could have'." },
  { re: /\bshould of\b/gi, fix: "should have", why: "'Should of' is a mishearing of 'should have'." },
  { re: /\balot\b/gi, fix: "a lot", why: "'A lot' is two words." },
  { re: /\b(\w+) \1\b/gi, fix: (_m, w) => w, why: "Repeated word." },
  { re: / {2,}/g, fix: " ", why: "Extra spaces." },
];

export function grammarCheck(text: string): { corrected: string; corrections: Correction[] } {
  let corrected = text;
  const corrections: Correction[] = [];
  for (const rule of RULES) {
    corrected = corrected.replace(rule.re, (...args) => {
      const m = args[0] as string;
      const groups = args.slice(1, -2) as string[];
      const fixed = typeof rule.fix === "string" ? rule.fix : rule.fix(m, ...groups);
      if (fixed !== m && corrections.length < 12 && rule.why !== "Extra spaces.") {
        corrections.push({ found: m.trim(), suggestion: fixed.trim(), why: rule.why });
      }
      return fixed;
    });
  }
  // Capitalise sentence starts
  corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p, c) => p + c.toUpperCase());
  return { corrected, corrections };
}

/* ------------------------------------------------------------------ */
/* Essay analysis (IELTS-style band estimate)                           */
/* ------------------------------------------------------------------ */
const LINKERS = [
  "however", "moreover", "furthermore", "in addition", "therefore", "consequently", "nevertheless",
  "on the other hand", "for example", "for instance", "in conclusion", "to sum up", "firstly",
  "secondly", "finally", "although", "whereas", "while", "as a result", "in contrast", "similarly",
  "overall", "thus", "hence", "despite", "in my opinion", "to conclude",
];
const ACADEMIC = [
  "significant", "substantial", "crucial", "furthermore", "consequently", "perspective", "approach",
  "evidence", "factor", "impact", "benefit", "issue", "individual", "society", "economic", "policy",
  "phenomenon", "inevitable", "detrimental", "advocate", "contend", "emphasise", "emphasize",
  "undeniable", "sustainable", "fundamental", "notion", "prevalent", "mitigate", "facilitate",
  "enhance", "diverse", "comprehensive", "considerable", "alleviate", "profound",
];
const COMPLEX = ["which", "who", "whom", "whose", "although", "though", "unless", "whereas", "if", "because", "since", "while", "when", "that"];

export type EssayAnalysis = {
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentence: number;
  lexicalDiversity: number;
  linkers: string[];
  academic: string[];
  bands: { task: number; coherence: number; lexical: number; grammar: number };
  overall: number;
  corrections: Correction[];
  tips: string[];
};

const clampBand = (n: number) => Math.max(3, Math.min(9, Math.round(n * 2) / 2));

export function analyzeEssay(text: string, minWords = 250): EssayAnalysis {
  const clean = text.trim();
  const wordsArr = clean.toLowerCase().match(/[a-z']+/g) ?? [];
  const words = wordsArr.length;
  const sentencesArr = clean.split(/[.!?]+\s/).filter((s) => s.trim().length > 2);
  const sentences = Math.max(1, sentencesArr.length);
  const paragraphs = clean.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 20).length;
  const avgSentence = Math.round((words / sentences) * 10) / 10;
  const unique = new Set(wordsArr.filter((w) => w.length > 3));
  const lexicalDiversity = Math.round((unique.size / Math.max(1, wordsArr.filter((w) => w.length > 3).length)) * 100) / 100;
  const lower = clean.toLowerCase();
  const linkers = LINKERS.filter((l) => new RegExp(`\\b${l}\\b`).test(lower));
  const academic = ACADEMIC.filter((a) => new RegExp(`\\b${a}\\b`).test(lower));
  const complexCount = wordsArr.filter((w) => COMPLEX.includes(w)).length;
  const lengths = sentencesArr.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const variety = Math.sqrt(lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, lengths.length));
  const { corrections } = grammarCheck(clean);

  const lengthRatio = Math.min(1.2, words / minWords);
  const hasPosition = /\b(i believe|in my opinion|i agree|i disagree|i would argue|this essay)\b/.test(lower);
  const task = clampBand(3 + lengthRatio * 3.5 + (paragraphs >= 4 ? 1 : paragraphs >= 3 ? 0.5 : 0) + (hasPosition ? 0.8 : 0) + (/in conclusion|to conclude|to sum up/.test(lower) ? 0.5 : 0));
  const coherence = clampBand(4 + Math.min(3, linkers.length * 0.45) + (paragraphs >= 4 ? 1.2 : paragraphs >= 2 ? 0.5 : -0.5) + (lengthRatio > 0.8 ? 0.5 : 0));
  const lexical = clampBand(3.5 + lexicalDiversity * 4 + Math.min(2, academic.length * 0.3) + (lengthRatio > 0.6 ? 0.3 : -0.5));
  const grammar = clampBand(5 + Math.min(1.5, (complexCount / sentences) * 1.5) + Math.min(1, variety / 6) + (avgSentence > 12 && avgSentence < 28 ? 0.7 : 0) - corrections.length * 0.35 + (lengthRatio > 0.6 ? 0 : -1));
  const overall = clampBand((task + coherence + lexical + grammar) / 4);

  const tips: string[] = [];
  if (words < minWords) tips.push(`Write at least ${minWords} words — you have ${words}. Under-length essays lose Task Response marks.`);
  if (paragraphs < 4) tips.push("Use a clear 4–5 paragraph structure: introduction, 2–3 body paragraphs, conclusion.");
  if (!hasPosition) tips.push("State your position clearly in the introduction (e.g. 'I firmly believe that…').");
  if (linkers.length < 5) tips.push("Add more cohesive devices: 'Furthermore', 'In contrast', 'As a result', 'Nevertheless'.");
  if (academic.length < 4) tips.push("Upgrade vocabulary with precise academic words: 'substantial', 'detrimental', 'mitigate', 'prevalent'.");
  if (lexicalDiversity < 0.6) tips.push("Avoid repeating the same words — use synonyms and paraphrase the question.");
  if (variety < 4) tips.push("Vary sentence length: mix short punchy sentences with longer complex ones.");
  if (complexCount / sentences < 0.8) tips.push("Include more complex structures: relative clauses (which/who), conditionals (if/unless), concession (although).");
  if (corrections.length) tips.push(`Fix ${corrections.length} grammar/usage issue${corrections.length > 1 ? "s" : ""} highlighted below.`);
  if (!tips.length) tips.push("Excellent work! To push higher, add more nuanced examples and hedging language ('arguably', 'to some extent').");

  return { words, sentences, paragraphs, avgSentence, lexicalDiversity, linkers, academic, bands: { task, coherence, lexical, grammar }, overall, corrections, tips };
}

/* ------------------------------------------------------------------ */
/* Offline conversational tutors                                        */
/* ------------------------------------------------------------------ */
const IELTS_Q = [
  "Let's begin Part 1. Can you tell me your full name and where you're from?",
  "Do you work or are you a student? What do you enjoy most about it?",
  "Let's talk about your hometown. What do you like most about living there?",
  "How do you usually spend your weekends?",
  "Now Part 2. Describe a book that had a big impact on you. You should say what it was, when you read it, what it was about, and explain why it influenced you. You have about two minutes.",
  "Thank you. Would you recommend that book to others? Why?",
  "Now Part 3. Do you think people read less today than in the past? Why might that be?",
  "How might technology change the way children learn in the future?",
  "Some say governments should fund the arts more. To what extent do you agree?",
  "That's the end of the speaking test. Well done! Type 'again' to restart.",
];

const TOPICS: Record<string, string[]> = {
  travel: ["Where's the most memorable place you've travelled to?", "What do you usually pack first when you travel?", "Would you rather explore a big city or relax on a beach? Why?"],
  food: ["What's a dish from your country that everyone should try?", "Do you enjoy cooking? What's your signature dish?", "What's the strangest food you've ever eaten?"],
  work: ["What does a typical day at work or school look like for you?", "What skills do you think will be most important in ten years?", "What would your dream job be?"],
  movie: ["What's a film you could watch again and again?", "Do you prefer watching films at home or at the cinema?", "Which actor would you love to meet?"],
  music: ["What kind of music do you listen to when you need energy?", "Have you ever learned to play an instrument?", "What song reminds you of your childhood?"],
  english: ["What's the hardest part of English for you?", "Which English word do you find the most beautiful?", "How do you practise English outside the club?"],
  default: ["That's interesting! Can you tell me a bit more about that?", "How did that make you feel?", "Why do you think that is?", "What would you do differently next time?", "If you could change one thing about that, what would it be?", "Do you think most people in your country feel the same way?"],
};

const FILLERS = /\b(um+|uh+|erm|like,|you know|basically|actually)\b/gi;

function pick<T>(arr: T[], seed: number) {
  return arr[Math.abs(seed) % arr.length];
}

function feedbackLine(text: string) {
  const { corrections } = grammarCheck(text);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const fillers = text.match(FILLERS)?.length ?? 0;
  const parts: string[] = [];
  if (corrections.length) {
    parts.push(`💡 Quick fix: "${corrections[0].found}" → "${corrections[0].suggestion}" (${corrections[0].why})`);
  }
  if (words < 8) parts.push("🗣️ Try to extend your answer with a reason or an example.");
  else if (words > 40) parts.push("🌟 Great, detailed answer!");
  if (fillers > 1) parts.push(`⏸️ You used ${fillers} filler words — try pausing silently instead.`);
  return parts.join("\n");
}

export function offlineTutor(mode: string, messages: ChatMsg[]): string {
  const userMsgs = messages.filter((m) => m.role === "user");
  const last = userMsgs[userMsgs.length - 1]?.content ?? "";
  const n = userMsgs.length;
  const lower = last.toLowerCase();

  if (mode === "ielts-speaking") {
    if (lower.trim() === "again") return IELTS_Q[0];
    const fb = n > 0 ? feedbackLine(last) : "";
    const q = IELTS_Q[Math.min(n, IELTS_Q.length - 1)];
    return [fb, q].filter(Boolean).join("\n\n");
  }

  if (mode === "grammar") {
    if (!last.trim()) return "Send me any sentence or paragraph and I'll correct it and explain the rules.";
    const { corrected, corrections } = grammarCheck(last);
    if (!corrections.length) {
      return `✅ Looks great! I couldn't spot any common errors.\n\n**Level up:** try rephrasing with a more advanced structure, e.g. using a relative clause ("…, which…") or an inversion ("Rarely have I…").`;
    }
    return `**Corrected version:**\n> ${corrected}\n\n**What changed:**\n${corrections.map((c) => `- "${c.found}" → "${c.suggestion}" — ${c.why}`).join("\n")}`;
  }

  if (mode === "sat" || mode === "toefl") {
    const topicNote =
      mode === "sat"
        ? "For SAT Reading & Writing, always go back to the text for evidence — the correct answer is directly supported, never assumed."
        : "For TOEFL Integrated tasks, take structured notes: main point, 2–3 supporting points, and how the lecture relates to the reading.";
    if (/\b(what does|meaning of|define|definition)\b/.test(lower)) {
      const word = lower.replace(/.*(?:what does|meaning of|define|definition of?)\s+/, "").replace(/[^a-z\s-]/g, "").trim().split(" ")[0];
      return `**"${word}"** — Try this 3-step strategy:\n1. Look at the context around the word for clues (contrast words like *but/however* flip meaning).\n2. Break it down: prefixes (un-, dis-, mal-) and roots (bene = good, chron = time).\n3. Substitute each answer choice into the sentence and see which keeps the meaning.\n\n${topicNote}\n\n_Tip: set OPENAI_API_KEY for full AI definitions._`;
    }
    const tips = [
      `${topicNote}`,
      "Eliminate answers with extreme language ('always', 'never', 'completely') — they're usually wrong.",
      "Read the question stem before the passage so you know what to look for.",
      "For grammar questions, check subject–verb agreement first, then punctuation (semicolons join two complete sentences).",
      "Manage your time: about 71 seconds per SAT R&W question; don't get stuck — mark and move on.",
    ];
    return `${feedbackLine(last) || "Good question!"}\n\n**Strategy tip:** ${pick(tips, n)}\n\nWant to test yourself? Hit the **Quiz** tab for timed practice.`;
  }

  // conversation partner (default)
  if (n <= 1 && !last.trim()) return "Hi! I'm Wordy, your speaking partner. What would you like to talk about today — travel, food, work, movies or music?";
  const topicKey = Object.keys(TOPICS).find((k) => lower.includes(k)) ?? "default";
  const reactions = ["Oh, nice!", "I see.", "That sounds fascinating.", "Really? Tell me more.", "Interesting point!", "Ha, I love that."];
  const fb = feedbackLine(last);
  const q = pick(TOPICS[topicKey], n + last.length);
  return [pick(reactions, last.length), q, fb ? `\n${fb}` : ""].filter(Boolean).join(" ").replace(" \n", "\n\n");
}

export const SYSTEM_PROMPTS: Record<string, string> = {
  conversation:
    "You are Wordy, a warm, witty English conversation partner at Gelan English Club. Keep replies short (2–4 sentences), ask one follow-up question, and if the learner made a notable grammar or vocabulary mistake, add a brief '💡 Quick fix:' line at the end. Keep it natural and encouraging.",
  "ielts-speaking":
    "You are a certified IELTS Speaking examiner. Conduct a realistic test: Part 1 (familiar topics), Part 2 (cue card, 2 minutes), Part 3 (abstract discussion). Ask ONE question at a time. After each answer give a one-line feedback note (fluency, vocabulary, grammar, pronunciation hints) prefixed with 💡, then the next question. At the end, estimate a band score with justification.",
  grammar:
    "You are a precise English grammar coach. For every text the learner sends, return: **Corrected version** (quoted), then **What changed** as a bullet list with short rule explanations, then one **Level up** suggestion for a more advanced phrasing. Use markdown.",
  sat:
    "You are an expert SAT Reading & Writing tutor. Explain concepts clearly with examples, give strategy tips, and when asked, create SAT-style practice questions with 4 options (A–D), then reveal the answer and reasoning only after the student responds. Use markdown, be concise.",
  toefl:
    "You are an expert TOEFL iBT tutor covering Reading, Listening, Speaking and Writing. Give concise, actionable strategies, templates and model answers. Create practice tasks on request and evaluate responses using the official TOEFL rubrics. Use markdown.",
  "ielts-writing":
    "You are a senior IELTS Writing examiner. Evaluate the essay using the four official criteria (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy). Give a band for each and overall, list 3 strengths, 3 priority improvements with rewritten example sentences, and a short model paragraph. Use markdown headings and bullets. Be concise but specific.",
};
