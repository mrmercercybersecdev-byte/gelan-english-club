import { db } from "@/db";
import { blogPosts, channels, chatMessages, events, posts, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./session";
import { seedAbout } from "./seed-about";
import { seedGroups } from "./seed-groups";

let seeding: Promise<void> | null = null;

function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function runSeed() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events);

  if (count === 0) {
    await db.insert(events).values([
      {
        title: "Coffee & Conversation Circle",
        description:
          "Our signature weekly meetup. Grab a drink, join a small table of 4–6 people and chat about everyday topics with a friendly facilitator. Conversation cards are provided so there is never an awkward silence. Perfect for your first visit!",
        category: "Conversation",
        level: "All levels",
        location: "Online — add your meeting details",
        host: "Emma Clarke",
        startsAt: daysFromNow(2, 18, 30),
        durationMinutes: 90,
        capacity: 24,
      },
      {
        title: "Book Club: Animal Farm by George Orwell",
        description:
          "This month we finish George Orwell's short classic. We'll discuss themes of power and propaganda, share favourite quotes, and learn some of the rich vocabulary Orwell uses. Please read chapters 6–10 beforehand.",
        category: "Book Club",
        level: "Intermediate+",
        location: "Add venue details",
        host: "Daniel Okafor",
        startsAt: daysFromNow(5, 19, 0),
        durationMinutes: 75,
        capacity: 15,
      },
      {
        title: "Friendly Debate Night: Should Homework Be Banned?",
        description:
          "Practise structuring arguments, agreeing and disagreeing politely, and thinking on your feet. Teams are assigned on the night, and we finish with feedback on useful debate phrases.",
        category: "Debate",
        level: "Upper-intermediate+",
        location: "Add venue details",
        host: "Sofia Martins",
        startsAt: daysFromNow(8, 18, 0),
        durationMinutes: 120,
        capacity: 20,
      },
      {
        title: "Pronunciation Workshop: The Tricky 'TH'",
        description:
          "A hands-on workshop focusing on the 'th' sounds, word stress and connected speech. Includes mirror exercises, tongue twisters and recording yourself to track your progress.",
        category: "Workshop",
        level: "Beginner–Intermediate",
        location: "Online — add meeting details",
        host: "James Whitfield",
        startsAt: daysFromNow(11, 17, 30),
        durationMinutes: 60,
        capacity: 30,
      },
      {
        title: "Movie Night: Paddington 2",
        description:
          "Watch the heart-warming British film with English subtitles, then stay for a relaxed discussion about British humour, idioms and culture. Popcorn is on us!",
        category: "Social",
        level: "All levels",
        location: "Add venue details",
        host: "Emma Clarke",
        startsAt: daysFromNow(14, 19, 30),
        durationMinutes: 150,
        capacity: 40,
      },
      {
        title: "Job Interview English Bootcamp",
        description:
          "Prepare for interviews in English: common questions, the STAR method, describing strengths and weaknesses, and mock interviews in pairs with detailed feedback.",
        category: "Workshop",
        level: "Intermediate+",
        location: "Add venue details",
        host: "Priya Sharma",
        startsAt: daysFromNow(18, 10, 0),
        durationMinutes: 180,
        capacity: 16,
      },
    ]);
  }

  const [{ postCount }] = await db
    .select({ postCount: sql<number>`count(*)::int` })
    .from(posts);

  if (postCount === 0) {
    await db.insert(posts).values([
      {
        author: "Lucía",
        kind: "idiom",
        content: "Break the ice",
        meaning: "To do or say something to make people feel more relaxed, especially at first meetings.",
        likes: 12,
      },
      {
        author: "Kenji",
        kind: "question",
        content: "What's the difference between 'I've been to Paris' and 'I've gone to Paris'?",
        meaning: "'Been to' = you visited and came back. 'Gone to' = you are still there!",
        likes: 9,
      },
      {
        author: "Amira",
        kind: "tip",
        content: "Shadowing podcasts for 10 minutes a day really improved my rhythm and intonation.",
        meaning: null,
        likes: 15,
      },
      {
        author: "Marco",
        kind: "idiom",
        content: "It's not my cup of tea",
        meaning: "A polite British way to say you don't really like something.",
        likes: 7,
      },
      {
        author: "Olena",
        kind: "tip",
        content: "Change your phone language to English — you'll learn tons of practical vocabulary.",
        meaning: null,
        likes: 5,
      },
    ]);
  }
}

async function seedCommunity() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(channels);
  if (c === 0) {
    await db.insert(channels).values([
      { slug: "general", name: "General", emoji: "👋", description: "Say hi and chat about anything — in English!", sortOrder: 1 },
      { slug: "grammar-help", name: "Grammar Help", emoji: "🧩", description: "Stuck on a rule? Ask the community.", sortOrder: 2 },
      { slug: "ielts-prep", name: "IELTS Prep", emoji: "🎓", description: "Share tips, essays and speaking partners for IELTS.", sortOrder: 3 },
      { slug: "sat-toefl", name: "SAT & TOEFL", emoji: "📝", description: "Test strategies and study buddies.", sortOrder: 4 },
      { slug: "book-club", name: "Book Club", emoji: "📚", description: "Discuss this month's book (spoilers allowed!).", sortOrder: 5 },
      { slug: "random", name: "Random", emoji: "🎲", description: "Memes, music, movies and more.", sortOrder: 6 },
    ]);
  }

  const [{ u }] = await db.select({ u: sql<number>`count(*)::int` }).from(users);
  if (u === 0 && process.env.SEED_DEMO_DATA !== "false") {
    const demo = [
      ["lucia_r", "Lucía R.", "Argentina", 2450, 12, "#db2777"],
      ["kenji_t", "Kenji T.", "Japan", 1980, 9, "#2563eb"],
      ["amira_k", "Amira K.", "Egypt", 1610, 21, "#0f766e"],
      ["marco_b", "Marco B.", "Italy", 1230, 4, "#d97706"],
      ["olena_s", "Olena S.", "Ukraine", 980, 7, "#7c3aed"],
      ["wei_chen", "Wei C.", "China", 760, 3, "#059669"],
      ["demo", "Demo Learner", "Brazil", 120, 1, "#b8322a"],
    ] as const;
    const inserted = await db
      .insert(users)
      .values(
        demo.map(([username, displayName, country, xp, streak, avatarColor]) => ({
          username,
          displayName,
          country,
          xp,
          streak,
          avatarColor,
          lastActiveDate: new Date().toISOString().slice(0, 10),
          passwordHash: hashPassword(username === "demo" ? "demo1234" : Math.random().toString(36)),
        })),
      )
      .returning({ id: users.id, username: users.username });

    const byName = Object.fromEntries(inserted.map((r) => [r.username, r.id]));
    const [general] = await db.select().from(channels).where(eq(channels.slug, "general"));
    const [grammar] = await db.select().from(channels).where(eq(channels.slug, "grammar-help"));
    if (general && grammar) {
      await db.insert(chatMessages).values([
        { channelId: general.id, userId: byName.lucia_r, body: "Good morning everyone! ☀️ Who's coming to the Coffee & Conversation Circle this week?" },
        { channelId: general.id, userId: byName.kenji_t, body: "Me! It's my 10th time. I finally stopped being nervous 😅" },
        { channelId: general.id, userId: byName.amira_k, body: "Congrats Kenji! Tip for newcomers: try the Speaking Studio before the meetup — it really helps you warm up." },
        { channelId: general.id, userId: byName.marco_b, body: "Has anyone tried the IELTS essay grader? I got a 6.5 on my first try 🎉" },
        { channelId: grammar.id, userId: byName.olena_s, body: "Quick question: is it 'I have been to London last year' or 'I went to London last year'?" },
        { channelId: grammar.id, userId: byName.wei_chen, body: "'I went to London last year' — with a finished time like 'last year' we use past simple, not present perfect." },
        { channelId: grammar.id, userId: byName.olena_s, body: "Ahh that makes sense, thank you! 🙏" },
      ]);
    }
  }

  const [{ b }] = await db.select({ b: sql<number>`count(*)::int` }).from(blogPosts);
  if (b === 0) {
    await db.insert(blogPosts).values([
      {
        slug: "7-habits-of-fluent-english-speakers",
        title: "7 Habits of Highly Fluent English Speakers",
        excerpt: "Fluency isn't a gift — it's a set of habits. Here are the seven routines our most confident members swear by.",
        coverImage: "/images/hero.jpg",
        tags: "fluency,speaking,habits",
        author: "Emma Clarke",
        content: `Fluency isn't magic. After five years of running conversation circles, we've noticed that our most confident speakers share a handful of simple habits.

## 1. They think in English (a little)
Start small: narrate what you're doing in your head. *"I'm making coffee. The kettle is boiling."* It feels silly, but it trains your brain to skip translation.

## 2. They shadow native audio
Pick a 30-second podcast clip and repeat it **at the same time** as the speaker. This builds rhythm, stress and intonation faster than anything else.

## 3. They collect chunks, not words
Instead of learning *"decision"*, learn **"make a decision"**, **"a tough decision"**, **"reach a decision"**.

> "The limits of my language mean the limits of my world." — Ludwig Wittgenstein

## 4. They embrace mistakes
Every mistake is data. Our Speaking Studio highlights them gently so you can fix them next time.

## 5. They practise little and often
Ten minutes a day beats two hours once a week. Keep your streak alive! 🔥

## 6. They talk to real people
Join a [live meeting room](/meet) or come to a [club event](/events).

## 7. They have fun
Watch films you love, sing in the shower, argue about football. Joy is the best teacher.`,
      },
      {
        slug: "ielts-writing-task-2-band-7-blueprint",
        title: "The Band 7 Blueprint for IELTS Writing Task 2",
        excerpt: "A simple four-paragraph structure, the linking words examiners love, and the mistakes that keep people stuck at 6.",
        coverImage: "/images/debate.jpg",
        tags: "ielts,writing,exams",
        author: "Priya Sharma",
        content: `Stuck at Band 6? You're not alone. Here's the exact structure we teach in our IELTS workshops.

## The four-paragraph structure
1. **Introduction** — paraphrase the question + clear position.
2. **Body 1** — main idea, explanation, specific example.
3. **Body 2** — second idea (or counter-argument + rebuttal).
4. **Conclusion** — restate your position; no new ideas.

## Linking words that actually help
- *Contrast:* however, nevertheless, whereas
- *Addition:* furthermore, moreover, in addition
- *Result:* consequently, as a result, therefore

## Common Band 6 traps
- Writing under 250 words
- Memorised, generic introductions
- Repeating the same vocabulary
- No clear opinion

**Try it now:** head to the [AI Learning Lab](/learn/ielts) and get an instant band estimate on your essay.`,
      },
      {
        slug: "british-vs-american-english-cheat-sheet",
        title: "British vs American English: The Ultimate Cheat Sheet",
        excerpt: "Lift or elevator? Biscuit or cookie? A fun guide to the differences that trip learners up.",
        coverImage: "/images/bookclub.jpg",
        tags: "vocabulary,culture",
        author: "James Whitfield",
        content: `Both are correct — the key is **consistency**. Pick one style for exams and stick with it.

## Vocabulary
- flat 🇬🇧 / apartment 🇺🇸
- lift 🇬🇧 / elevator 🇺🇸
- biscuit 🇬🇧 / cookie 🇺🇸
- queue 🇬🇧 / line 🇺🇸
- holiday 🇬🇧 / vacation 🇺🇸

## Spelling
- colour / color
- organise / organize
- centre / center
- travelled / traveled

## Grammar
In British English you'll often hear *"Have you got…?"* while Americans say *"Do you have…?"*.

> Fun fact: "Fall" for autumn was actually common in Britain in the 1600s!`,
      },
    ]);
  }
}

export function ensureSeed() {
  if (!seeding) {
    const seed = process.env.SEED_DEMO_DATA === "false"
      ? seedCommunity()
      : runSeed().then(seedCommunity).then(seedAbout).then(seedGroups);
    seeding = seed.catch((err) => {
      seeding = null;
      console.error("Seed failed", err);
    });
  }
  return seeding;
}
