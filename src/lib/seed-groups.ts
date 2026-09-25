import { db } from "@/db";
import { announcements, groupMembers, groupPosts, studyGroups, submissions, users } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";

export { GROUP_CATEGORIES } from "./group-categories";

export async function seedGroups() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(studyGroups);
  if (c === 0) {
    await db.insert(studyGroups).values([
      { slug: "twister-titans", name: "Twister Titans", category: "tongue-twister", emoji: "👅", color: "#db2777", level: "All levels", schedule: "Daily challenge · Live drill Wed 19:00", description: "Tie your tongue in knots — on purpose! A new tongue twister every week, speed challenges and voice-recording battles.", challenge: "This week: \"Which witch switched the Swiss wristwatches?\" — record yourself 3× fast and submit it for verification!" },
      { slug: "word-hoarders", name: "Word Hoarders", category: "vocabulary", emoji: "📚", color: "#7c3aed", level: "Intermediate+", schedule: "Word of the day · Quiz Sun 18:00", description: "Collect 10 new words a week, share mnemonics and battle in Sunday vocab quizzes.", challenge: "Use 'serendipity', 'candid' and 'resilient' in one short story (under 100 words)." },
      { slug: "debate-society", name: "Debate Society", category: "debate", emoji: "🎤", color: "#b8322a", level: "Upper-intermediate+", schedule: "Fri 18:00 · Monthly tournament", description: "Structured British Parliamentary debates, rebuttal drills and prep for the annual championship.", challenge: "Motion of the week: 'This house would ban homework.' Post your strongest argument!", joinPolicy: "approval", maxMembers: 40 },
      { slug: "grammar-gym-crew", name: "Grammar Gym Crew", category: "grammar", emoji: "🧩", color: "#0f766e", level: "Beginner–Intermediate", schedule: "Tue & Thu 17:30", description: "Short daily grammar workouts. Tenses, articles, prepositions — no question is too basic." },
      { slug: "accent-lab", name: "Accent Lab", category: "pronunciation", emoji: "🗣️", color: "#2563eb", level: "All levels", schedule: "Sat 11:00", description: "Minimal pairs, stress, intonation and connected speech. Bring your mirror!", challenge: "Record 'ship / sheep, full / fool, bat / bet' and submit for feedback." },
      { slug: "page-turners", name: "Page Turners", category: "book-club", emoji: "📖", color: "#059669", level: "Intermediate+", schedule: "Bi-weekly Thu 19:00", description: "One book a month, discussion questions, vocabulary lists and cozy chats." },
      { slug: "band-8-squad", name: "Band 8 Squad", category: "exam-prep", emoji: "🎓", color: "#d97706", level: "Upper-intermediate+", schedule: "Mon & Wed 20:00", description: "IELTS, TOEFL and SAT study buddies. Weekly essay swaps and mock speaking tests.", joinPolicy: "approval", maxMembers: 60 },
      { slug: "boardroom-english", name: "Boardroom English", category: "business", emoji: "💼", color: "#1f2d4a", level: "Intermediate+", schedule: "Wed 12:30 (lunch break)", description: "Emails, meetings, presentations and negotiations for professionals." },
      { slug: "ink-and-quill", name: "Ink & Quill", category: "creative-writing", emoji: "✍️", color: "#9333ea", level: "All levels", schedule: "Prompts every Monday", description: "Weekly writing prompts, poetry nights and gentle peer feedback." },
      { slug: "slang-squad", name: "Slang Squad", category: "idioms-slang", emoji: "🦜", color: "#ea580c", level: "All levels", schedule: "Anytime", description: "Sound like a native: idioms, phrasal verbs and the latest slang, explained with memes." },
    ]);

    // demo memberships & posts
    const demo = await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.username, ["lucia_r", "kenji_t", "amira_k", "marco_b", "olena_s", "wei_chen"]));
    const groups = await db.select().from(studyGroups);
    if (demo.length && groups.length) {
      const rows: { groupId: number; userId: number; role: string }[] = [];
      groups.forEach((g, gi) => demo.forEach((u, ui) => { if ((gi + ui) % 3 !== 0) rows.push({ groupId: g.id, userId: u.id, role: ui === 0 && gi % 4 === 0 ? "moderator" : "member" }); }));
      await db.insert(groupMembers).values(rows).onConflictDoNothing();
      const by = Object.fromEntries(demo.map((d) => [d.username, d.id]));
      const gs = Object.fromEntries(groups.map((g) => [g.slug, g.id]));
      await db.insert(groupPosts).values([
        { groupId: gs["twister-titans"], userId: by.kenji_t ?? demo[0].id, body: "I managed the Swiss wristwatches one 3 times without stopping!! 🎉 Took me 20 tries though 😂" },
        { groupId: gs["twister-titans"], userId: by.amira_k ?? demo[0].id, body: "Tip: slow down first, exaggerate every sound, then speed up gradually. Works every time." },
        { groupId: gs["word-hoarders"], userId: by.olena_s ?? demo[0].id, body: "Today's find: 'petrichor' — the smell of earth after rain. Isn't that beautiful? 🌧️" },
        { groupId: gs["debate-society"], userId: by.lucia_r ?? demo[0].id, body: "Opening for the homework motion: homework widens inequality because not every child has a quiet place to study at home." },
        { groupId: gs["band-8-squad"], userId: by.marco_b ?? demo[0].id, body: "Anyone want to swap Task 2 essays this week? I'm doing the 'working from home' prompt." },
      ].filter((p) => p.groupId));
    }
  }

  const [{ a }] = await db.select({ a: sql<number>`count(*)::int` }).from(announcements);
  if (a === 0) {
    const inDays = (d: number) => new Date(Date.now() + d * 86_400_000);
    await db.insert(announcements).values([
      { title: "🏆 Debate Championship sign-ups are open!", category: "event", pinned: true, showBanner: true, linkUrl: "/groups/debate-society", linkLabel: "Join the Debate Society", author: "Sofia Martins", expiresAt: inDays(30), body: "Teams of 2–3 can now register for the **Spring Debate Championship**. Preliminary rounds start next month and the grand final will be **livestreamed** on the About page.\n\n- Open to all levels (B1+ recommended)\n- Free training sessions every Friday\n- Winners join the Hall of Champions 🏆" },
      { title: "New: submit your work for verification ✅", category: "update", pinned: true, author: "Priya Sharma", linkUrl: "/submit", linkLabel: "Submit work", body: "You can now send essays, voice recordings, homework or certificates straight to the organisers. Approved work receives a **verification code** anyone can check — perfect for your CV — plus **+50 XP**." },
      { title: "Study groups are here 👥", category: "news", author: "Emma Clarke", linkUrl: "/groups", linkLabel: "Browse groups", body: "Join Tongue Twisters, Vocabulary, Debate, Grammar and more. Each group has a weekly challenge, its own discussion board and friendly moderators." },
      { title: "Games night: crossword tournament 🧩", category: "celebration", author: "Gelan English Club", linkUrl: "/games", linkLabel: "Practise now", body: "Top 3 crossword times on the games leaderboard this Friday win a Gelan mug! Warm up with the new **Crossword**, **Word Scramble**, **Hangman** and **Tongue Twister Race** games." },
      { title: "Conversation Circle update", category: "urgent", author: "Gelan English Club", expiresAt: inDays(7), body: "The Conversation Circle will meet online this week. Join the live room from the Meet page at the usual time." },
    ]);

    // one sample pending submission so the admin review queue isn't empty
    const [demoUser] = await db.select({ id: users.id }).from(users).where(inArray(users.username, ["demo"]));
    if (demoUser) {
      await db.insert(submissions).values({
        userId: demoUser.id,
        kind: "essay",
        title: "IELTS Task 2 — Working from home",
        textContent: "In recent years, technology has made it possible for many people to work from home. In my opinion, the advantages of this trend outweigh the disadvantages.\n\nFirstly, remote work saves time and money that would otherwise be spent on commuting. Furthermore, employees often report a better work-life balance.\n\nOn the other hand, some people feel isolated and find it hard to separate work from private life. However, these problems can be mitigated with clear routines and regular team meetings.\n\nIn conclusion, I believe working from home is a positive development for both employers and employees.",
      });
    }
  }
}
