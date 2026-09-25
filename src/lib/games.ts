export const GAMES = [
  { id: "crossword", name: "Crossword", icon: "🧩", tagline: "A fresh interlocking puzzle every time", color: "from-indigo-500 via-violet-600 to-fuchsia-600", maxScore: 2000, minWinMs: 15_000 },
  { id: "scramble", name: "Word Scramble", icon: "🔀", tagline: "Unscramble as many words as you can in 60s", color: "from-amber-400 via-orange-500 to-rose-500", maxScore: 5000, minWinMs: 0 },
  { id: "hangman", name: "Hangman", icon: "🪢", tagline: "Guess the word before the rope runs out", color: "from-emerald-500 via-teal-600 to-cyan-600", maxScore: 1000, minWinMs: 2_000 },
  { id: "twister", name: "Tongue Twister Race", icon: "👅", tagline: "Type the twister as fast and accurately as you can", color: "from-pink-500 via-rose-500 to-red-500", maxScore: 3000, minWinMs: 1_500 },
] as const;

export type GameId = (typeof GAMES)[number]["id"];

export type Clue = { word: string; clue: string };

export const CLUE_BANK: Clue[] = [
  { word: "ELOQUENT", clue: "Fluent and persuasive in speaking" },
  { word: "IDIOM", clue: "'Break the ice' is one of these" },
  { word: "VERB", clue: "An action word" },
  { word: "NOUN", clue: "Person, place or thing" },
  { word: "ADJECTIVE", clue: "Describes a noun" },
  { word: "SYNONYM", clue: "A word with the same meaning" },
  { word: "ANTONYM", clue: "A word with the opposite meaning" },
  { word: "FLUENT", clue: "Speaking smoothly and easily" },
  { word: "ACCENT", clue: "A distinctive way of pronouncing a language" },
  { word: "GRAMMAR", clue: "The rules of a language" },
  { word: "VOWEL", clue: "A, E, I, O or U" },
  { word: "SYLLABLE", clue: "'Ba-na-na' has three of these" },
  { word: "DEBATE", clue: "A formal argument between two sides" },
  { word: "ESSAY", clue: "A short piece of writing on a topic" },
  { word: "LIBRARY", clue: "Where you borrow books" },
  { word: "NOVEL", clue: "A long fictional story" },
  { word: "POETRY", clue: "Verse with rhythm and often rhyme" },
  { word: "RHYME", clue: "Cat and hat do this" },
  { word: "TENSE", clue: "Past, present or future form of a verb" },
  { word: "PLURAL", clue: "More than one" },
  { word: "SPEECH", clue: "A talk given to an audience" },
  { word: "LISTEN", clue: "Pay attention to sound" },
  { word: "DIALOGUE", clue: "A conversation between characters" },
  { word: "METAPHOR", clue: "'Time is money', for example" },
  { word: "PROVERB", clue: "A short, wise saying" },
  { word: "SLANG", clue: "Very informal words and phrases" },
  { word: "QUIZ", clue: "A short test of knowledge" },
  { word: "WORD", clue: "A single unit of language" },
  { word: "BOOK", clue: "You read it, cover to cover" },
  { word: "CLUB", clue: "Gelan English ___" },
  { word: "CHAT", clue: "An informal conversation" },
  { word: "TALK", clue: "Speak with someone" },
  { word: "READ", clue: "Look at and understand written words" },
  { word: "WRITE", clue: "Put words on paper" },
  { word: "SPELL", clue: "Name the letters of a word in order" },
  { word: "PHRASE", clue: "A small group of words" },
  { word: "PREFIX", clue: "'Un-' in 'unhappy'" },
  { word: "SUFFIX", clue: "'-ness' in 'kindness'" },
  { word: "COMMA", clue: "Punctuation mark for a short pause" },
  { word: "PERIOD", clue: "American name for a full stop" },
  { word: "ARTICLE", clue: "'A', 'an' or 'the'" },
  { word: "PRONOUN", clue: "'She', 'they' or 'it'" },
  { word: "ADVERB", clue: "'Quickly' is one" },
  { word: "CANDID", clue: "Truthful and straightforward" },
  { word: "NUANCE", clue: "A subtle difference in meaning" },
  { word: "WITTY", clue: "Cleverly funny" },
  { word: "IELTS", clue: "Exam with Band scores from 1 to 9" },
  { word: "TOEFL", clue: "Exam with a score out of 120" },
  { word: "ORATOR", clue: "A skilled public speaker" },
  { word: "LEXICON", clue: "The vocabulary of a language" },
];

export const SCRAMBLE_WORDS = [
  "language", "grammar", "fluency", "vocabulary", "sentence", "paragraph", "conversation", "pronounce", "listening", "speaking",
  "writing", "reading", "question", "answer", "library", "dictionary", "adventure", "confident", "friendship", "knowledge",
  "education", "practice", "journey", "improve", "culture", "festival", "comfortable", "delicious", "beautiful", "wonderful",
  "chocolate", "umbrella", "elephant", "mountain", "birthday", "restaurant", "breakfast", "holiday", "weather", "neighbour",
];

export const HANGMAN_WORDS: { word: string; hint: string }[] = [
  { word: "SERENDIPITY", hint: "Finding something good by chance" },
  { word: "WANDERLUST", hint: "A strong desire to travel" },
  { word: "RESILIENT", hint: "Able to recover quickly" },
  { word: "UBIQUITOUS", hint: "Found everywhere" },
  { word: "MELANCHOLY", hint: "A deep, pensive sadness" },
  { word: "EPHEMERAL", hint: "Lasting a very short time" },
  { word: "GREGARIOUS", hint: "Fond of company; sociable" },
  { word: "MAGNIFICENT", hint: "Extremely beautiful or impressive" },
  { word: "PERSEVERANCE", hint: "Persistence despite difficulty" },
  { word: "ARTICULATE", hint: "Able to express ideas clearly" },
  { word: "CONUNDRUM", hint: "A confusing and difficult problem" },
  { word: "QUINTESSENTIAL", hint: "The most perfect example of something" },
  { word: "BAMBOOZLE", hint: "To trick or confuse someone" },
  { word: "KERFUFFLE", hint: "A commotion or fuss (British)" },
  { word: "LACKADAISICAL", hint: "Lacking enthusiasm and determination" },
];

export const TWISTERS = [
  "She sells seashells by the seashore.",
  "Peter Piper picked a peck of pickled peppers.",
  "How can a clam cram in a clean cream can?",
  "Red lorry, yellow lorry, red lorry, yellow lorry.",
  "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.",
  "I scream, you scream, we all scream for ice cream.",
  "Six slippery snails slid slowly seaward.",
  "Betty Botter bought some butter, but she said the butter's bitter.",
  "A proper copper coffee pot.",
  "Truly rural, truly rural, truly rural.",
  "Unique New York, unique New York, you know you need unique New York.",
  "Which witch switched the Swiss wristwatches?",
];

/* ---------------- deterministic RNG ---------------- */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWith<T>(arr: T[], rnd: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function scramble(word: string, rnd: () => number = Math.random) {
  if (word.length < 2) return word;
  let s = word;
  for (let k = 0; k < 10 && s === word; k++) s = shuffleWith(word.split(""), rnd).join("");
  return s;
}

/* ---------------- crossword generator ---------------- */
export type Placed = { word: string; clue: string; row: number; col: number; dir: "across" | "down"; num: number };
export type Crossword = { rows: number; cols: number; words: Placed[]; grid: (string | null)[][] };

export function generateCrossword(seed: number, count = 10): Crossword {
  const rnd = mulberry32(seed);
  const pool = shuffleWith(CLUE_BANK, rnd).slice(0, 28).sort((a, b) => b.word.length - a.word.length);
  const SIZE = 30;
  const grid: (string | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const placed: Omit<Placed, "num">[] = [];

  const canPlace = (w: string, r: number, c: number, dir: "across" | "down") => {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const endR = r + dr * (w.length - 1);
    const endC = c + dc * (w.length - 1);
    if (r < 0 || c < 0 || endR >= SIZE || endC >= SIZE) return -1;
    // cells before/after must be empty
    const br = r - dr, bc = c - dc, ar = endR + dr, ac = endC + dc;
    if (br >= 0 && bc >= 0 && grid[br][bc]) return -1;
    if (ar < SIZE && ac < SIZE && grid[ar]?.[ac]) return -1;
    let crossings = 0;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      const cell = grid[rr][cc];
      if (cell) {
        if (cell !== w[i]) return -1;
        crossings++;
      } else {
        // perpendicular neighbours must be empty to avoid accidental words
        if (dir === "across" && ((rr > 0 && grid[rr - 1][cc]) || (rr < SIZE - 1 && grid[rr + 1][cc]))) return -1;
        if (dir === "down" && ((cc > 0 && grid[rr][cc - 1]) || (cc < SIZE - 1 && grid[rr][cc + 1]))) return -1;
      }
    }
    return crossings;
  };

  const put = (w: Clue, r: number, c: number, dir: "across" | "down") => {
    for (let i = 0; i < w.word.length; i++) grid[r + (dir === "down" ? i : 0)][c + (dir === "across" ? i : 0)] = w.word[i];
    placed.push({ word: w.word, clue: w.clue, row: r, col: c, dir });
  };

  const first = pool[0];
  put(first, Math.floor(SIZE / 2), Math.floor((SIZE - first.word.length) / 2), "across");

  for (const cand of pool.slice(1)) {
    if (placed.length >= count) break;
    let best: { r: number; c: number; dir: "across" | "down"; score: number } | null = null;
    for (const p of placed) {
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < cand.word.length; j++) {
          if (p.word[i] !== cand.word[j]) continue;
          const dir = p.dir === "across" ? "down" : "across";
          const r = p.dir === "across" ? p.row - j : p.row + i;
          const c = p.dir === "across" ? p.col + i : p.col - j;
          const x = canPlace(cand.word, r, c, dir);
          if (x > 0) {
            const score = x * 10 + rnd();
            if (!best || score > best.score) best = { r, c, dir, score };
          }
        }
      }
    }
    if (best) put(cand, best.r, best.c, best.dir);
  }

  // crop
  let minR = SIZE, minC = SIZE, maxR = 0, maxC = 0;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
  const rows = maxR - minR + 1, cols = maxC - minC + 1;
  const cropped = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => grid[r + minR][c + minC]));

  // numbering (reading order)
  const starts = placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));
  const keyOrder = Array.from(new Set(starts.map((s) => `${s.row},${s.col}`))).sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number), [br, bc] = b.split(",").map(Number);
    return ar - br || ac - bc;
  });
  const words: Placed[] = starts.map((s) => ({ ...s, num: keyOrder.indexOf(`${s.row},${s.col}`) + 1 }));
  return { rows, cols, words, grid: cropped };
}
