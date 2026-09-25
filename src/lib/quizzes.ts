export type Question = { q: string; options: string[]; answer: number; explain: string };

export type Track = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  gradient: string;
  tutorMode: string;
  tutorIntro: string;
  essayPrompts?: string[];
  minWords?: number;
  questions: Question[];
};

export const TRACKS: Track[] = [
  {
    id: "ielts",
    name: "IELTS Academic",
    tagline: "Band 7+ strategies, essay grading & a mock speaking examiner",
    icon: "🎓",
    gradient: "from-rose-500 via-red-600 to-orange-500",
    tutorMode: "ielts-speaking",
    tutorIntro: "Good afternoon. I'm your IELTS examiner today. Type 'ready' when you'd like to begin the speaking test.",
    minWords: 250,
    essayPrompts: [
      "Some people believe that university education should be free for everyone. Others think students should pay for their own studies. Discuss both views and give your opinion.",
      "In many countries, the number of people living alone is increasing. What are the causes of this trend? Is it a positive or negative development?",
      "Technology has made it easier for people to work from home. Do the advantages of this outweigh the disadvantages?",
      "Some people think that international tourism has brought enormous benefits to many places. Others believe it causes serious problems. Discuss both views and give your own opinion.",
    ],
    questions: [
      { q: "Choose the best word: The government should take ___ measures to reduce air pollution.", options: ["drastic", "drastically", "drasticness", "drast"], answer: 0, explain: "An adjective is needed before the noun 'measures'." },
      { q: "Which linking phrase best shows contrast?", options: ["Furthermore", "As a result", "Nevertheless", "For instance"], answer: 2, explain: "'Nevertheless' introduces a contrasting idea." },
      { q: "In IELTS Writing Task 2, how many words should you write at minimum?", options: ["150", "200", "250", "300"], answer: 2, explain: "Task 2 requires at least 250 words; Task 1 requires 150." },
      { q: "Pick the most academic synonym for 'big problem':", options: ["huge deal", "significant issue", "really bad thing", "large trouble"], answer: 1, explain: "'Significant issue' is formal and precise." },
      { q: "The graph shows that sales ___ sharply between 2010 and 2015.", options: ["rise", "have risen", "rose", "rising"], answer: 2, explain: "Past simple for a finished time period in the past." },
      { q: "TRUE / FALSE / NOT GIVEN: If the text doesn't mention the information at all, you answer…", options: ["TRUE", "FALSE", "NOT GIVEN", "NO"], answer: 2, explain: "'Not Given' = the passage neither confirms nor contradicts it." },
      { q: "Which is the best paraphrase of 'Many people think'?", options: ["Lots of guys reckon", "It is widely believed", "Everyone knows", "People always say"], answer: 1, explain: "'It is widely believed' is a formal passive paraphrase." },
      { q: "Speaking Part 2: how long should you speak?", options: ["30 seconds", "1 minute", "1–2 minutes", "5 minutes"], answer: 2, explain: "You have 1 minute to prepare and speak for up to 2 minutes." },
    ],
  },
  {
    id: "sat",
    name: "SAT Reading & Writing",
    tagline: "Words in context, grammar conventions & evidence questions",
    icon: "📝",
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    tutorMode: "sat",
    tutorIntro: "Hey! I'm your SAT coach. Ask me about any question type, or say 'give me a practice question'.",
    minWords: 150,
    essayPrompts: [
      "Write a short analytical response (150+ words): Should schools replace printed textbooks entirely with digital resources? Support your position with reasons and examples.",
    ],
    questions: [
      { q: "The scientist's findings were ___: they were confirmed by three independent labs.", options: ["dubious", "corroborated", "fabricated", "ambiguous"], answer: 1, explain: "Confirmed by others = corroborated." },
      { q: "Choose the correct punctuation: The museum was closed ___ we went to the park instead.", options: [", ", "; ", " and, ", ": and"], answer: 1, explain: "A semicolon joins two independent clauses." },
      { q: "Each of the students ___ required to submit a portfolio.", options: ["are", "were", "is", "be"], answer: 2, explain: "'Each' is singular, so the verb is 'is'." },
      { q: "Her speech was so ___ that the audience was moved to tears.", options: ["poignant", "banal", "terse", "pedantic"], answer: 0, explain: "'Poignant' means evoking sadness or regret." },
      { q: "Which transition best fits? 'The plan was expensive. ___, it was approved unanimously.'", options: ["Therefore", "Similarly", "Nonetheless", "For example"], answer: 2, explain: "Contrast between 'expensive' and 'approved' → Nonetheless." },
      { q: "'Ephemeral' most nearly means:", options: ["everlasting", "short-lived", "enormous", "invisible"], answer: 1, explain: "Ephemeral = lasting a very short time." },
      { q: "Pick the most concise option:", options: ["due to the fact that", "because", "owing to the reason that", "on account of the fact that"], answer: 1, explain: "The SAT rewards concision when meaning is preserved." },
      { q: "The team, along with its coach, ___ traveling to the finals.", options: ["are", "is", "were", "have been"], answer: 1, explain: "The subject is 'team' (singular); 'along with…' is parenthetical." },
    ],
  },
  {
    id: "toefl",
    name: "TOEFL iBT",
    tagline: "Integrated tasks, note-taking & academic discussion",
    icon: "🌍",
    gradient: "from-emerald-500 via-teal-600 to-cyan-600",
    tutorMode: "toefl",
    tutorIntro: "Welcome! I'm your TOEFL tutor. Ask about any section or request a practice task.",
    minWords: 100,
    essayPrompts: [
      "Academic Discussion (100+ words): Your professor asks: 'Should universities require all students to take a course in personal finance?' Share your opinion and respond to a classmate who argues it should be optional.",
    ],
    questions: [
      { q: "In the TOEFL Speaking section, how many tasks are there (2023+ format)?", options: ["2", "4", "6", "8"], answer: 1, explain: "The current TOEFL iBT has 4 speaking tasks." },
      { q: "The lecture ___ the reading passage by presenting counterexamples.", options: ["supports", "challenges", "repeats", "ignores"], answer: 1, explain: "Counterexamples challenge a claim." },
      { q: "'Ubiquitous' most nearly means:", options: ["rare", "everywhere", "ancient", "dangerous"], answer: 1, explain: "Ubiquitous = found everywhere." },
      { q: "Best note-taking abbreviation for 'because':", options: ["b/c", "bcz", "bec.", "All work"], answer: 3, explain: "Any consistent abbreviation works — speed matters!" },
      { q: "Which phrase is best for introducing a classmate's view?", options: ["He said stuff", "As Maria points out,", "Maria is wrong,", "Somebody thinks"], answer: 1, explain: "Referencing classmates politely boosts your score." },
      { q: "Choose the correct form: The data ___ that the hypothesis was correct.", options: ["suggests / suggest", "suggesting", "to suggest", "suggestion"], answer: 0, explain: "'Data' can be singular or plural in modern academic English." },
    ],
  },
  {
    id: "grammar",
    name: "Grammar Gym",
    tagline: "Tenses, articles, prepositions & tricky rules",
    icon: "🏋️",
    gradient: "from-violet-500 via-purple-600 to-fuchsia-600",
    tutorMode: "grammar",
    tutorIntro: "Send me any sentence and I'll correct it and explain the rule. 💪",
    minWords: 80,
    essayPrompts: ["Write a short paragraph (80+ words) about your last holiday. Try to use the past simple, past continuous and past perfect."],
    questions: [
      { q: "I ___ here since 2019.", options: ["live", "am living", "have lived", "lived"], answer: 2, explain: "Present perfect with 'since' for an action continuing to now." },
      { q: "She's interested ___ learning Japanese.", options: ["on", "in", "at", "for"], answer: 1, explain: "'Interested in' is the fixed preposition." },
      { q: "If I ___ you, I would apologise.", options: ["am", "was", "were", "be"], answer: 2, explain: "Second conditional uses 'were' for all subjects (formal)." },
      { q: "___ Eiffel Tower is in Paris.", options: ["A", "An", "The", "—"], answer: 2, explain: "Unique landmarks take 'the'." },
      { q: "By the time we arrived, the film ___.", options: ["started", "has started", "had started", "starts"], answer: 2, explain: "Past perfect for an action before another past action." },
      { q: "Which is correct?", options: ["Less people came", "Fewer people came", "Lesser people came", "Few people came more"], answer: 1, explain: "'Fewer' for countable nouns, 'less' for uncountable." },
      { q: "I'm looking forward ___ you.", options: ["to see", "to seeing", "seeing", "for seeing"], answer: 1, explain: "'Look forward to' + -ing (to is a preposition here)." },
      { q: "Neither the manager nor the employees ___ happy.", options: ["was", "is", "were", "be"], answer: 2, explain: "With neither/nor, the verb agrees with the nearer subject ('employees')." },
    ],
  },
  {
    id: "idioms",
    name: "Idioms & Slang",
    tagline: "Sound like a native with everyday expressions",
    icon: "🦜",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    tutorMode: "conversation",
    tutorIntro: "Hiya! Let's chat — I'll sprinkle in idioms and explain them as we go. What's on your mind?",
    questions: [
      { q: "'Bite the bullet' means…", options: ["eat quickly", "face something difficult bravely", "get angry", "tell a lie"], answer: 1, explain: "To accept something unpleasant with courage." },
      { q: "'Under the weather' means…", options: ["outside", "slightly ill", "very happy", "in trouble"], answer: 1, explain: "Feeling a bit sick." },
      { q: "'Spill the beans' means…", options: ["make a mess", "cook dinner", "reveal a secret", "waste money"], answer: 2, explain: "To tell secret information." },
      { q: "'Hit the sack' means…", options: ["go to bed", "start a fight", "go shopping", "work hard"], answer: 0, explain: "To go to sleep." },
      { q: "'A piece of cake' means…", options: ["a dessert", "very easy", "a small part", "a celebration"], answer: 1, explain: "Something very easy to do." },
      { q: "'Cost an arm and a leg' means…", options: ["be painful", "be very expensive", "be dangerous", "be cheap"], answer: 1, explain: "Extremely expensive." },
      { q: "'Let the cat out of the bag' means…", options: ["free a pet", "reveal a secret by mistake", "go outside", "start a rumour on purpose"], answer: 1, explain: "Accidentally reveal a secret." },
    ],
  },
];

export function getTrack(id: string) {
  return TRACKS.find((t) => t.id === id);
}

export const PRONUNCIATION_SENTENCES = [
  "The thirty-three thieves thought that they thrilled the throne throughout Thursday.",
  "She sells seashells by the seashore.",
  "I would like a glass of water, please.",
  "Red lorry, yellow lorry, red lorry, yellow lorry.",
  "Peter Piper picked a peck of pickled peppers.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "Could you tell me the way to the nearest train station?",
  "The weather is wonderful and warm this weekend.",
  "Comfortable vegetables are surprisingly difficult to pronounce.",
  "Particularly, the rural jewellery was entirely unavailable.",
  "Whether the weather is warm or whether the weather is cold, we'll weather the weather.",
  "I thoroughly enjoyed the thought-provoking theatre production.",
];

export const SPEAKING_SCENARIOS = [
  { id: "free", icon: "💬", title: "Free chat", opener: "Hi! I'm Wordy, your speaking partner. What would you like to talk about today?" },
  { id: "cafe", icon: "☕", title: "Ordering at a café", opener: "Hi there, welcome to the Reading Room Café! What can I get for you today?" },
  { id: "interview", icon: "💼", title: "Job interview", opener: "Good morning, thanks for coming in. Could you start by telling me a little about yourself?" },
  { id: "travel", icon: "✈️", title: "Airport check-in", opener: "Good evening. May I see your passport and booking reference, please?" },
  { id: "doctor", icon: "🩺", title: "At the doctor's", opener: "Hello, please have a seat. What seems to be the problem today?" },
  { id: "debate", icon: "🎤", title: "Friendly debate", opener: "Let's debate! Here's the motion: 'Social media does more harm than good.' Are you for or against?" },
];
