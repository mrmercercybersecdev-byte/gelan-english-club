export const ACTIVITIES: Record<string, { xp: number; label: string; cooldownSec: number }> = {
  quiz_correct: { xp: 10, label: "Correct quiz answer", cooldownSec: 2 },
  quiz_complete: { xp: 25, label: "Completed a quiz", cooldownSec: 10 },
  essay: { xp: 40, label: "Submitted an essay", cooldownSec: 30 },
  tutor_message: { xp: 3, label: "Practised with AI tutor", cooldownSec: 5 },
  speaking_turn: { xp: 6, label: "Speaking practice", cooldownSec: 4 },
  pronunciation: { xp: 8, label: "Pronunciation drill", cooldownSec: 3 },
  chat_message: { xp: 2, label: "Chat message", cooldownSec: 20 },
  meeting_join: { xp: 30, label: "Joined a live meeting", cooldownSec: 600 },
  blog_read: { xp: 3, label: "Read a blog post", cooldownSec: 60 },
  daily_bonus: { xp: 15, label: "Daily check-in", cooldownSec: 60 * 60 * 20 },
  flashcard: { xp: 2, label: "Flashcard reviewed", cooldownSec: 1 },
  game_win: { xp: 15, label: "Won a word game", cooldownSec: 15 },
  submission_approved: { xp: 50, label: "Submission verified", cooldownSec: 0 },
  group_join: { xp: 10, label: "Joined a group", cooldownSec: 30 },
  group_post: { xp: 3, label: "Posted in a group", cooldownSec: 30 },
};

export function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
}

export function xpForLevel(level: number) {
  return 50 * (level - 1) ** 2;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, base, next, pct: Math.round(((xp - base) / (next - base)) * 100) };
}

const TITLES = [
  "Novice",
  "Apprentice",
  "Chatterbox",
  "Wordsmith",
  "Orator",
  "Rhetorician",
  "Linguist",
  "Luminary",
  "Grandmaster",
  "Legend",
];

export function rankTitle(xp: number) {
  const lvl = levelFromXp(xp);
  return TITLES[Math.min(TITLES.length - 1, Math.floor((lvl - 1) / 2))];
}

export type Badge = { id: string; icon: string; name: string; desc: string };

export const BADGES: (Badge & { test: (s: BadgeStats) => boolean })[] = [
  { id: "first", icon: "🌱", name: "First Steps", desc: "Earn your first XP", test: (s) => s.xp > 0 },
  { id: "streak3", icon: "🔥", name: "On Fire", desc: "3-day streak", test: (s) => s.streak >= 3 },
  { id: "streak7", icon: "☄️", name: "Unstoppable", desc: "7-day streak", test: (s) => s.streak >= 7 },
  { id: "chat", icon: "💬", name: "Chatterbox", desc: "Send 10 chat messages", test: (s) => (s.counts.chat_message ?? 0) >= 10 },
  { id: "quiz", icon: "🧠", name: "Quiz Whiz", desc: "Complete 3 quizzes", test: (s) => (s.counts.quiz_complete ?? 0) >= 3 },
  { id: "essay", icon: "✍️", name: "Essayist", desc: "Submit an essay for grading", test: (s) => (s.counts.essay ?? 0) >= 1 },
  { id: "voice", icon: "🎙️", name: "Golden Voice", desc: "10 speaking turns", test: (s) => (s.counts.speaking_turn ?? 0) + (s.counts.pronunciation ?? 0) >= 10 },
  { id: "meet", icon: "📹", name: "Face to Face", desc: "Join a live meeting", test: (s) => (s.counts.meeting_join ?? 0) >= 1 },
  { id: "reader", icon: "📰", name: "Bookworm", desc: "Read 3 blog posts", test: (s) => (s.counts.blog_read ?? 0) >= 3 },
  { id: "verified", icon: "✅", name: "Verified", desc: "Get a submission approved", test: (s) => (s.counts.submission_approved ?? 0) >= 1 },
  { id: "gamer", icon: "🎮", name: "Word Gamer", desc: "Win 5 word games", test: (s) => (s.counts.game_win ?? 0) >= 5 },
  { id: "team", icon: "🤝", name: "Team Player", desc: "Join a study group", test: (s) => (s.counts.group_join ?? 0) >= 1 },
  { id: "xp500", icon: "⭐", name: "Rising Star", desc: "Reach 500 XP", test: (s) => s.xp >= 500 },
  { id: "xp2000", icon: "👑", name: "Royalty", desc: "Reach 2,000 XP", test: (s) => s.xp >= 2000 },
];

export type BadgeStats = { xp: number; streak: number; counts: Record<string, number> };

export function earnedBadges(stats: BadgeStats): Badge[] {
  return BADGES.filter((b) => b.test(stats)).map(({ id, icon, name, desc }) => ({ id, icon, name, desc }));
}

export const AVATAR_COLORS = ["#b8322a", "#1f2d4a", "#0f766e", "#7c3aed", "#d97706", "#db2777", "#2563eb", "#059669"];
