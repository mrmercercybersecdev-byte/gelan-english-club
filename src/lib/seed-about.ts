import { db } from "@/db";
import { champions, channels, livestreams, meetRooms, milestones, teamMembers } from "@/db/schema";
import { sql } from "drizzle-orm";

const count = async (t: typeof teamMembers | typeof champions | typeof milestones | typeof livestreams) =>
  (await db.select({ c: sql<number>`count(*)::int` }).from(t))[0].c;

export async function seedAbout() {
  // A dedicated chat channel used by the livestream player
  await db
    .insert(channels)
    .values({ slug: "livestream", name: "Livestream", emoji: "🔴", description: "Live chat for club broadcasts.", sortOrder: 99 })
    .onConflictDoNothing();

  if ((await count(teamMembers)) === 0) {
    await db.insert(teamMembers).values([
      {
        name: "Emma Clarke", title: "Founder & President", group: "leader", country: "United Kingdom", joinedYear: 2019,
        photoUrl: "/images/team/emma.jpg", color: "#b8322a", sortOrder: 1,
        specialties: "Community building, Conversation, Events",
        bio: "Emma started Gelan English Club at a single café table in 2019 after years of teaching English abroad. She leads the club's vision, partnerships and the Tuesday conversation circles.",
        quote: "Confidence comes from conversation, not perfection.",
      },
      {
        name: "Daniel Okafor", title: "Vice President · Book Club Director", group: "leader", country: "Nigeria", joinedYear: 2019,
        photoUrl: "/images/team/daniel.jpg", color: "#1f2d4a", sortOrder: 2,
        specialties: "Literature, Reading circles, Mentoring",
        bio: "A lifelong bookworm and former literature lecturer, Daniel curates our monthly reads and trains new facilitators. He has hosted over 70 book club sessions.",
        quote: "Every book is a conversation waiting to happen.",
      },
      {
        name: "Sofia Martins", title: "Head of Debate & Public Speaking", group: "leader", country: "Portugal", joinedYear: 2020,
        photoUrl: "/images/team/sofia.jpg", color: "#0f766e", sortOrder: 3,
        specialties: "Debate, Public speaking, Rhetoric",
        bio: "Sofia founded the Gelan Debate League and coaches our championship teams. She's a two-time national debate finalist and a TEDx speaker.",
        quote: "Your voice matters — let's make it heard.",
      },
      {
        name: "Priya Sharma", title: "Director of Exam Programs", group: "leader", country: "India", joinedYear: 2021,
        photoUrl: "/images/team/priya.jpg", color: "#7c3aed", sortOrder: 4,
        specialties: "IELTS, SAT, TOEFL, Academic writing",
        bio: "A certified IELTS trainer, Priya designed our exam workshops and the AI Learning Lab's essay grader. Her students average a full band improvement in 3 months.",
        quote: "Strategy beats stress. Every single time.",
      },
      { name: "James Whitfield", title: "Pronunciation Coach", group: "facilitator", country: "Canada", joinedYear: 2020, color: "#d97706", sortOrder: 10, specialties: "Pronunciation, Accent training, Phonetics", bio: "Former radio presenter who makes the 'th' sound fun." },
      { name: "Aiko Tanaka", title: "Beginner Circle Facilitator", group: "facilitator", country: "Japan", joinedYear: 2021, color: "#db2777", sortOrder: 11, specialties: "Beginners, Small talk, Confidence", bio: "Went from shy learner to facilitator — now helps others do the same." },
      { name: "Carlos Mendes", title: "Business English Lead", group: "facilitator", country: "Brazil", joinedYear: 2021, color: "#2563eb", sortOrder: 12, specialties: "Business English, Presentations, Interviews", bio: "Runs our Job Interview Bootcamps and networking nights." },
      { name: "Hannah Schmidt", title: "Grammar Gym Trainer", group: "facilitator", country: "Germany", joinedYear: 2022, color: "#059669", sortOrder: 13, specialties: "Grammar, Tenses, Writing", bio: "Believes grammar is a puzzle, not a punishment." },
      { name: "Omar Haddad", title: "IELTS Speaking Mentor", group: "facilitator", country: "Jordan", joinedYear: 2022, color: "#b8322a", sortOrder: 14, specialties: "IELTS Speaking, Fluency, Mock tests", bio: "Scored band 8.5 and now runs weekly mock speaking tests." },
      { name: "Grace Liu", title: "Creative Writing Host", group: "facilitator", country: "Singapore", joinedYear: 2023, color: "#7c3aed", sortOrder: 15, specialties: "Creative writing, Storytelling, Poetry", bio: "Hosts the monthly Storytelling Slam and poetry nights." },
      { name: "Liam O'Connor", title: "Movie Night & Idioms Host", group: "facilitator", country: "Ireland", joinedYear: 2023, color: "#1f2d4a", sortOrder: 16, specialties: "Idioms, Slang, Film", bio: "Can explain any idiom with a film quote. Probably." },
      { name: "Fatima Zahra", title: "Youth Program Coordinator", group: "facilitator", country: "Morocco", joinedYear: 2024, color: "#0f766e", sortOrder: 17, specialties: "Teens, Games, Vocabulary", bio: "Leads our under-18 program with games and challenges." },
    ]);
  }

  if ((await count(champions)) === 0) {
    await db.insert(champions).values([
      { name: "Lucía Rodríguez", award: "Debate Champion", competition: "Gelan Debate Championship", category: "debate", place: 1, season: "Spring", year: 2025, country: "Argentina", description: "Won the grand final arguing against the motion 'AI will replace language teachers' with a unanimous judges' decision." },
      { name: "Kenji Tanaka", award: "Runner-up", competition: "Gelan Debate Championship", category: "debate", place: 2, season: "Spring", year: 2025, country: "Japan", description: "Best rebuttal speech of the tournament." },
      { name: "Marco Bianchi", award: "Third Place", competition: "Gelan Debate Championship", category: "debate", place: 3, season: "Spring", year: 2025, country: "Italy", description: "Crowd favourite for his witty closing statements." },
      { name: "Amira Khalil", award: "The Golden Mic", competition: "Public Speaking Cup", category: "speech", place: 1, season: "Summer", year: 2025, country: "Egypt", description: "Her speech 'The Word That Changed My Life' earned a standing ovation." },
      { name: "Wei Chen", award: "Spelling Bee Champion", competition: "Winter Spelling Bee", category: "spelling", place: 1, season: "Winter", year: 2024, country: "China", description: "Clinched victory by spelling 'onomatopoeia' in the final round." },
      { name: "Olena Shevchenko", award: "Best Essay", competition: "Annual Essay Contest", category: "essay", place: 1, season: "Autumn", year: 2024, country: "Ukraine", description: "'Home Is a Language' was published in the city library anthology." },
      { name: "Kenji Tanaka", award: "Debate Champion", competition: "Gelan Debate Championship", category: "debate", place: 1, season: "Spring", year: 2024, country: "Japan", description: "First champion to go undefeated through every round." },
      { name: "Aisha Bello", award: "Quiz Master", competition: "Grand Grammar Quiz", category: "quiz", place: 1, season: "Summer", year: 2024, country: "Nigeria", description: "Perfect score across all five rounds." },
      { name: "Marco Bianchi", award: "Storyteller of the Year", competition: "Storytelling Slam", category: "storytelling", place: 1, season: "Autumn", year: 2023, country: "Italy", description: "Told a hilarious tale of ordering 'pants' in London." },
      { name: "Sara Novak", award: "Debate Champion", competition: "Gelan Debate Championship", category: "debate", place: 1, season: "Spring", year: 2023, country: "Croatia", description: "Our first ever champion — now a debate coach herself." },
    ]);
  }

  if ((await count(milestones)) === 0) {
    await db.insert(milestones).values([
      { year: 2019, month: "March", icon: "☕", title: "The first table", imageUrl: "/images/history.jpg", sortOrder: 1, description: "Six friends from five countries meet at a local café with a handwritten 'English Club' sign. Gelan English Club is born." },
      { year: 2019, month: "November", icon: "🎉", title: "50 members & a second table", sortOrder: 2, description: "Word spreads. Tuesday nights now need two tables, then three — and the café starts reserving the back room for us." },
      { year: 2020, month: "April", icon: "💻", title: "Going online", sortOrder: 3, description: "During lockdown we move to video calls. Members join from 12 countries and the club becomes truly global." },
      { year: 2021, month: "June", icon: "📚", title: "Book Club & Debate League", sortOrder: 4, description: "Daniel launches the monthly Book Club and Sofia starts the Debate League. Both sell out their first sessions." },
      { year: 2022, month: "September", icon: "🏆", title: "First Debate Championship", imageUrl: "/images/debate.jpg", sortOrder: 5, description: "Sixteen teams compete in our first championship. Sara Novak lifts the trophy after a nail-biting final." },
      { year: 2023, month: "March", icon: "🎓", title: "Exam programs launch", sortOrder: 6, description: "Priya introduces IELTS and SAT workshops. Members sit their exams with Gelan English Club support that year." },
      { year: 2024, month: "May", icon: "🎊", title: "1,000th event", imageUrl: "/images/bookclub.jpg", sortOrder: 7, description: "We celebrate our thousandth meetup with a festival of games, speeches and a giant cake shaped like a dictionary." },
      { year: 2025, month: "January", icon: "🚀", title: "Gelan Digital", sortOrder: 8, description: "Live video rooms, chat channels, the AI Learning Lab and the Speaking Studio open to every member, everywhere." },
      { year: 2027, month: "Summer", icon: "🌍", title: "Next chapter: Gelan Festival", sortOrder: 9, description: "Our dream: a weekend festival of English with clubs from around the world. Want to help? Get in touch!" },
    ]);
  }

  if ((await count(livestreams)) === 0) {
    await db.insert(meetRooms).values({ code: "gelan-live", title: "Gelan Live Studio", hostName: "Emma Clarke" }).onConflictDoNothing();
    const inDays = (d: number, h: number) => {
      const x = new Date();
      x.setDate(x.getDate() + d);
      x.setHours(h, 0, 0, 0);
      return x;
    };
    await db.insert(livestreams).values([
      { title: "Friday Open Mic — Live from the Studio", description: "Members share 2-minute speeches, poems and stories. Join the room to perform or just watch and cheer in the chat!", streamUrl: "/meet/gelan-live", status: "scheduled", host: "Emma Clarke", scheduledAt: inDays(3, 19) },
      { title: "IELTS Speaking Masterclass Q&A", description: "Priya and Omar answer your IELTS speaking questions live and run a mock Part 2 with a volunteer.", streamUrl: "/meet/gelan-live", status: "scheduled", host: "Priya Sharma", scheduledAt: inDays(9, 18) },
      { title: "Watch Party: Do Schools Kill Creativity?", description: "Our TED watch party replay — we watched Sir Ken Robinson's classic talk together and discussed it afterwards.", streamUrl: "https://www.youtube.com/watch?v=iG9CE55wbtY", status: "ended", host: "Daniel Okafor", scheduledAt: inDays(-12, 19) },
      { title: "Watch Party: The Power of Vulnerability", description: "Replay of our TED watch party featuring Brené Brown's talk, followed by a discussion on courage in language learning.", streamUrl: "https://www.youtube.com/watch?v=iCvmsMzlF7o", status: "ended", host: "Sofia Martins", scheduledAt: inDays(-30, 19) },
    ]);
  }
}
