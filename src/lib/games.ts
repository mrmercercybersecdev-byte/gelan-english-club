export const GAMES = [
  { id: "crossword", name: "Crossword", icon: "🧩", tagline: "A fresh interlocking puzzle every time", color: "from-indigo-500 via-violet-600 to-fuchsia-600", maxScore: 2000, minWinMs: 15_000, defaultPublished: true },
  { id: "scramble", name: "Word Scramble", icon: "🔀", tagline: "Unscramble as many words as you can in 60s", color: "from-amber-400 via-orange-500 to-rose-500", maxScore: 5000, minWinMs: 0, defaultPublished: true },
  { id: "hangman", name: "Hangman", icon: "🪢", tagline: "Guess the word before the rope runs out", color: "from-emerald-500 via-teal-600 to-cyan-600", maxScore: 1000, minWinMs: 2_000, defaultPublished: true },
  { id: "twister", name: "Tongue Twister Race", icon: "👅", tagline: "Type the twister as fast and accurately as you can", color: "from-pink-500 via-rose-500 to-red-500", maxScore: 3000, minWinMs: 1_500, defaultPublished: true },
  { id: "idiom-mixup", name: "Idiom Mix-Up", icon: "🥣", tagline: "Pick the meaning before the idiom gets away", color: "from-fuchsia-500 via-purple-600 to-indigo-600", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "punctuation-panic", name: "Punctuation Panic", icon: "🚨", tagline: "Save the sentence with one tiny mark", color: "from-cyan-500 via-sky-600 to-blue-700", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "rhyme-time", name: "Rhyme Time", icon: "🎤", tagline: "Find the rhyme before the beat drops", color: "from-rose-500 via-pink-600 to-violet-700", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "odd-one-out", name: "Odd Word Out", icon: "🕵️", tagline: "Spot the word that wandered into the wrong group", color: "from-lime-500 via-emerald-600 to-teal-700", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "emoji-decoder", name: "Emoji Decoder", icon: "🕵️‍♀️", tagline: "Translate emoji chaos into English phrases", color: "from-yellow-400 via-orange-500 to-red-600", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "verb-vortex", name: "Verb Vortex", icon: "🌀", tagline: "Choose the verb that keeps the sentence standing", color: "from-blue-500 via-indigo-600 to-violet-700", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "plural-panic", name: "Plural Panic", icon: "🐑", tagline: "One sheep, two sheep… and many tricky nouns", color: "from-teal-500 via-emerald-600 to-lime-700", maxScore: 1000, minWinMs: 0, defaultPublished: false },
  { id: "polite-or-chaos", name: "Polite or Chaos?", icon: "🎩", tagline: "Choose the reply that saves the conversation", color: "from-orange-500 via-amber-600 to-yellow-600", maxScore: 1000, minWinMs: 0, defaultPublished: false },
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
  { word: "BUBBLEGUM", hint: "Chewy, pink, and very hard to blow a professional bubble with" },
  { word: "KANGAROO", hint: "A jumping Australian marsupial" },
  { word: "PERSNICKETY", hint: "Fussy about small details" },
  { word: "FLABBERGASTED", hint: "So surprised your eyebrows need a moment" },
  { word: "MALAPROPISM", hint: "A funny word mix-up, such as a brave new 'world' becoming a brave new 'whirl'" },
  { word: "HULLABALOO", hint: "A noisy fuss over something small" },
  { word: "DISCOMBOBULATE", hint: "To confuse someone in a delightfully old-fashioned way" },
  { word: "PNEUMONOULTRAMICROSCOPICSILICOVOLCANOCONIOSIS", hint: "A famously enormous word for a lung condition caused by fine silica dust" },
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
  "A happy hippo hopped home holding a hat.",
  "Seven silly singers sang softly on Sunday.",
  "Brave blue birds bring bright berries before breakfast.",
  "Nina knew nine new neighbours named Noah.",
  "Tiny turtles took turns telling tall tales.",
  "Clever Clara carefully cleaned the crooked clock.",
  "Big black bugs bleed blue-black blood.",
  "Freshly fried flying fish fly freely.",
  "Larry's lizard lazily lounged on a little log.",
  "Four fine fresh fish for four funny friends.",
  "Round and round the rugged rocks the ragged rascal ran.",
  "A noisy nurse noticed nine nervous newts.",
  "Silly Sally swiftly shooed seven sheep.",
  "Green glass globes glow gently in the garden.",
  "Which wristwatches are Swiss wristwatches?",
  "The quick queen quietly questioned the quirky quail.",
  "Black background, brown background, black background, brown background.",
  "Can you can a can as a canner can can a can?",
  "I thought a thought, but the thought I thought wasn't the thought I thought.",
  "Six thick thistle sticks stood on six thin thistle sticks.",
  "Fred fed Ted bread, and Ted fed Fred bread.",
  "A proper purple paper parcel puzzled the postman.",
  "Which brave baker baked the biggest batch of buns?",
];

export type Challenge = { prompt: string; options: [string, string, string, string]; answer: number; hint: string; explain: string };
type ChallengeSet = { easy: Challenge[]; medium: Challenge[]; hard: Challenge[] };

const q = (prompt: string, options: [string, string, string, string], answer: number, hint: string, explain: string): Challenge => ({ prompt, options, answer, hint, explain });

export const ARCADE_CHALLENGES: Partial<Record<GameId, ChallengeSet>> = {
  "idiom-mixup": {
    easy: [
      q("If you 'break the ice', what are you doing?", ["Starting a friendly conversation", "Ending winter", "Breaking a glass", "Making a snowman"], 0, "It helps a quiet room feel less awkward.", "To break the ice is to make people feel more comfortable."),
      q("'Piece of cake' means…", ["A small dessert", "Something very easy", "A birthday party", "A difficult puzzle"], 1, "Think of a task that needs no sweat.", "A piece of cake is something easy to do."),
      q("If someone 'spills the beans', they…", ["Tell a secret", "Cook dinner", "Make a mess", "Plant a garden"], 0, "The beans are information, not food.", "To spill the beans is to reveal a secret."),
      q("'Under the weather' means feeling…", ["A little ill", "Very tall", "Excited about rain", "Lost outside"], 0, "It describes how you feel, not where you are.", "If you are under the weather, you feel unwell."),
      q("If you 'hit the books', you…", ["Study hard", "Throw a book", "Open a library", "Write a novel"], 0, "No books were harmed in the making of this idiom.", "To hit the books means to study."),
      q("'Once in a blue moon' means…", ["Very rarely", "Every evening", "During an eclipse", "At breakfast"], 0, "A blue moon does not visit often.", "The phrase means something happens very rarely."),
    ],
    medium: [
      q("To 'bite the bullet' is to…", ["Face something difficult bravely", "Eat too quickly", "Start a fight", "Make a loud noise"], 0, "It takes courage, not teeth.", "Biting the bullet means facing a difficult situation."),
      q("If a plan 'goes pear-shaped', it…", ["Turns into fruit", "Goes wrong", "Becomes popular", "Needs more details"], 1, "The plan has taken an unexpected turn.", "A pear-shaped plan has gone wrong."),
      q("To 'burn the midnight oil' means…", ["Work late into the night", "Waste electricity", "Cook after dark", "Sleep very early"], 0, "This idiom belongs to night owls.", "It means working late at night."),
      q("If you 'get cold feet', you…", ["Become nervous and hesitate", "Need warmer socks", "Run in the snow", "Change your mind happily"], 0, "This can happen just before a big decision.", "Cold feet means losing confidence or becoming nervous."),
      q("To 'add fuel to the fire' is to…", ["Make a problem worse", "Help put out a fire", "Cook dinner", "Change the subject"], 0, "Imagine a small argument getting bigger.", "Adding fuel to the fire makes a bad situation worse."),
      q("If you 'miss the boat', you…", ["Lose an opportunity", "Arrive at the harbour", "Forget your luggage", "Choose a better route"], 0, "The opportunity has already sailed away.", "Missing the boat means losing a chance."),
    ],
    hard: [
      q("To 'cut to the chase' means…", ["Get to the main point", "Run after someone", "Edit a film", "Change the topic"], 0, "Skip the long introduction.", "Cut to the chase means get to the important point quickly."),
      q("If something 'costs an arm and a leg', it is…", ["Very expensive", "A medical emergency", "Free for members", "Hard to carry"], 0, "Keep your limbs; check your wallet.", "It means the price is extremely high."),
      q("To 'throw in the towel' means…", ["Give up", "Start cleaning", "Challenge someone", "Finish a workout"], 0, "A boxer signals the end this way.", "Throwing in the towel means admitting defeat or stopping."),
      q("If you 'read between the lines', you…", ["Find an unstated meaning", "Read very quickly", "Skip every other line", "Study handwriting"], 0, "Look for what the writer implies.", "It means understanding a hidden or implied message."),
      q("To 'keep someone at arm's length' means…", ["Keep a little distance", "Offer a handshake", "Help them reach something", "Exercise together"], 0, "This is about emotional space, not measuring.", "It means avoiding becoming too close to someone."),
      q("If you 'put all your eggs in one basket', you…", ["Risk everything on one plan", "Go shopping", "Pack carefully", "Avoid making a choice"], 0, "One basket makes one point of failure.", "The idiom warns against relying on only one plan."),
    ],
  },
  "punctuation-panic": {
    easy: [
      q("Choose the correctly punctuated question.", ["Where are you going?", "Where are you going.", "Where are you going,", "Where are you going!"], 0, "A direct question needs a question mark.", "Questions end with a question mark."),
      q("Which sentence needs a full stop?", ["The bus is here", "Are we there", "Stop right now", "What a view"], 0, "It simply tells you something.", "A statement normally ends with a full stop."),
      q("Pick the best punctuation: 'Wow___ that was close.'", ["!", "?", ",", ":"], 0, "The speaker is surprised.", "An exclamation mark can show strong surprise."),
      q("Which is the correct list?", ["I packed pens, books, and snacks.", "I packed pens books and snacks.", "I packed, pens books, and snacks.", "I packed pens; books; and snacks."], 0, "Commas separate items in a list.", "Commas make the items in a list clear."),
      q("Choose the contraction for 'do not'.", ["don't", "dont'", "do'nt", "do,nt"], 0, "The apostrophe replaces a missing letter.", "Don't is the contraction of do not."),
      q("Which greeting is punctuated correctly?", ["Hello, Amina!", "Hello Amina?", "Hello; Amina", "Hello: Amina?"], 0, "A comma can separate a name in direct address.", "Use a comma before the name and an exclamation for a warm greeting."),
    ],
    medium: [
      q("Choose the sentence with the correct apostrophe.", ["The teacher's book is blue.", "The teachers book is blue.", "The teachers' book is blue. (one teacher)", "The teacher,s book is blue."], 0, "The book belongs to one teacher.", "A singular owner takes apostrophe-s."),
      q("Which sentence uses a comma after an opening phrase?", ["After lunch, we played a word game.", "After, lunch we played a word game.", "After lunch we, played a word game.", "After lunch; we played, a word game."], 0, "The opening phrase is 'After lunch'.", "A comma often follows an introductory phrase."),
      q("Choose the correctly punctuated dialogue.", ["Mina said, 'Good morning.'", "Mina said 'Good morning'.", "Mina, said, 'Good morning'.", "Mina said: Good morning."], 0, "Use a comma to introduce the exact words spoken.", "A comma introduces direct speech; the spoken words take quotation marks."),
      q("Which is a complete sentence?", ["Because the rain stopped.", "We left when the rain stopped.", "When the rain stopped and.", "After the rain."], 1, "It needs a subject and a complete thought.", "'We left when the rain stopped' is a complete thought."),
      q("Pick the correct semicolon use.", ["The bell rang; the lesson began.", "The; bell rang the lesson began.", "The bell; rang, the lesson began.", "The bell rang,; the lesson began."], 0, "Both sides can stand as complete sentences.", "A semicolon can join closely related independent clauses."),
      q("Choose the correct possessive for several students.", ["the students' projects", "the student's projects", "the students projects'", "the student,s projects"], 0, "More than one student owns them.", "Plural nouns ending in s usually add an apostrophe after the s."),
    ],
    hard: [
      q("Which sentence correctly uses a colon?", ["Bring three things: a pen, a notebook, and a smile.", "Bring: three things a pen, a notebook, and a smile.", "Bring three: things, a pen, a notebook, and a smile.", "Bring three things;: a pen, a notebook, and a smile."], 0, "The words before the colon introduce a list.", "Use a colon after a complete clause to introduce a list."),
      q("Choose the correctly punctuated sentence.", ["Its colour is bright; it's easy to see.", "It's colour is bright; its easy to see.", "Its colour is bright, it's easy to see.", "Its' colour is bright; its easy to see."], 0, "One word shows possession; the other means 'it is'.", "Its is possessive; it's means it is. A semicolon joins the clauses."),
      q("Which option correctly punctuates a nonessential name?", ["Our coach, Mr Ali, starts at nine.", "Our coach Mr Ali starts, at nine.", "Our coach; Mr Ali starts at nine.", "Our coach, Mr Ali starts at nine."], 0, "The name can be removed without changing the main sentence.", "Set a nonessential phrase off with a pair of commas."),
      q("Pick the correct punctuation for a list within a sentence.", ["The club offers debate, which builds confidence; reading, which builds vocabulary; and drama, which builds expression.", "The club offers: debate, reading, and drama.", "The club offers debate; which builds confidence, reading; and drama.", "The club offers debate, which builds confidence, reading, and drama, which builds expression."], 0, "The list items already contain commas.", "Semicolons separate complex list items that contain internal commas."),
      q("Which sentence correctly handles a quotation inside a quotation?", ["She asked, 'Did he really say " + '"' + "hello" + '"' + "?'", "She asked 'Did he really say hello?'", "She asked: 'Did he really say 'hello'?'", "She asked, 'Did he really say hello'?"], 0, "Use a second style of quotation mark inside the first.", "In standard US punctuation, use double quotation marks inside single quotation marks."),
      q("Choose the correct dash use.", ["The result—after weeks of practice—was worth it.", "The result—after weeks of practice was worth—it.", "The result after—weeks of practice—was worth it.", "The result; after weeks of practice; was worth it."], 0, "A pair of dashes can set off an interruption.", "Paired dashes enclose an interrupting phrase."),
    ],
  },
  "rhyme-time": {
    easy: [
      q("Which word rhymes with 'light'?", ["kite", "late", "let", "lot"], 0, "It shares the long 'i' sound and final t.", "Kite rhymes with light."),
      q("Which word rhymes with 'chair'?", ["share", "cheer", "char", "shore"], 0, "It is something you might do with a snack.", "Share rhymes with chair."),
      q("Which word rhymes with 'play'?", ["stay", "spy", "plow", "peel"], 0, "It means remain in one place.", "Stay rhymes with play."),
      q("Which word rhymes with 'book'?", ["look", "back", "boot", "bake"], 0, "You do this with your eyes.", "Look rhymes with book."),
      q("Which word rhymes with 'stone'?", ["phone", "sun", "stamp", "stun"], 0, "Most people carry one in a pocket.", "Phone rhymes with stone."),
      q("Which word rhymes with 'green'?", ["queen", "grain", "grown", "grin"], 0, "She might wear a crown.", "Queen rhymes with green."),
    ],
    medium: [
      q("Which word rhymes with 'though'?", ["grow", "through", "cough", "rough"], 0, "It means to get bigger.", "Grow shares the /oʊ/ ending sound with though."),
      q("Which word rhymes with 'flower'?", ["power", "floor", "flourish", "forward"], 0, "It can describe strength or electricity.", "Flower and power rhyme in common pronunciation."),
      q("Which pair has a perfect rhyme?", ["move / prove", "love / move", "food / good", "said / paid"], 0, "Listen to the vowel and final consonant sounds.", "Move and prove share the same ending sound."),
      q("Which word rhymes with 'island'?", ["highland", "inside", "isn't", "silent"], 0, "Think of a raised area of land.", "Island and highland share the stressed ending sound."),
      q("Which word rhymes with 'measure'?", ["pleasure", "master", "major", "miser"], 0, "Enjoyment is a…", "Measure and pleasure rhyme."),
      q("Which word rhymes with 'height'?", ["kite", "heat", "hit", "hate"], 0, "A small flying toy likes the wind.", "Height and kite rhyme."),
    ],
    hard: [
      q("Which word rhymes with 'colonel'?", ["kernel", "channel", "candle", "council"], 0, "The two words sound almost exactly alike.", "Colonel is pronounced like kernel."),
      q("Which word rhymes with 'choir'?", ["higher", "chore", "cheer", "wireless"], 0, "It is the comparative form of high.", "Choir and higher rhyme in many accents."),
      q("Which pair is a slant rhyme, not a perfect rhyme?", ["shape / keep", "near / fear", "bright / night", "stone / phone"], 0, "The ending sounds are similar but not identical.", "Shape and keep are a near/slant rhyme; the other pairs rhyme fully."),
      q("Which word rhymes with 'orange' in a commonly accepted near-rhyme?", ["door hinge", "strange", "range", "arrange"], 0, "Say the two words quickly together.", "Orange has few perfect rhymes; door hinge is a well-known near-rhyme."),
      q("Which word rhymes with 'aisle'?", ["style", "isle-ish", "seal", "sale"], 0, "It means a distinctive way of doing something.", "Aisle and style rhyme."),
      q("Which word rhymes with 'yacht'?", ["plot", "yolk", "patch", "youth"], 0, "A story often has one.", "Yacht and plot share the /ɒt/ ending sound in many accents."),
    ],
  },
  "odd-one-out": {
    easy: [
      q("Which word does not belong? apple · pear · carrot · peach", ["carrot", "apple", "pear", "peach"], 0, "Three grow on trees.", "Carrot is a vegetable; the others are fruits."),
      q("Which is not a punctuation mark? comma · colon · carrot · dash", ["carrot", "comma", "colon", "dash"], 0, "It is crunchy in a salad.", "Carrot is food, not punctuation."),
      q("Which one is not a vowel? A · E · G · O", ["G", "A", "E", "O"], 0, "It comes after F.", "G is a consonant."),
      q("Which word is not an animal? tiger · eagle · dolphin · table", ["table", "tiger", "eagle", "dolphin"], 0, "You might put a book on it.", "Table is furniture."),
      q("Which is not a day of the week? Tuesday · Friday · April · Sunday", ["April", "Tuesday", "Friday", "Sunday"], 0, "It is a month.", "April is a month, not a weekday."),
      q("Which is not a verb? swim · sing · joyful · write", ["joyful", "swim", "sing", "write"], 0, "It describes a feeling.", "Joyful is an adjective; the others are verbs."),
    ],
    medium: [
      q("Which word does not belong? whisper · murmur · shout · speak", ["shout", "whisper", "murmur", "speak"], 0, "The others are quiet ways to talk.", "Shout is loud; the others can be quiet."),
      q("Which is not a synonym for 'brief'? short · concise · tiny · lengthy", ["lengthy", "short", "concise", "tiny"], 0, "It means long.", "Lengthy is an antonym of brief."),
      q("Which word is not a prefix? un- · re- · -less · pre-", ["-less", "un-", "re-", "pre-"], 0, "It attaches to the end of a word.", "-less is a suffix."),
      q("Which word is not a conjunction? and · but · because · quickly", ["quickly", "and", "but", "because"], 0, "It often describes how an action is done.", "Quickly is an adverb."),
      q("Which is not a literary device? metaphor · simile · alliteration · calculator", ["calculator", "metaphor", "simile", "alliteration"], 0, "It helps with arithmetic, not poetry.", "A calculator is a tool, not a literary device."),
      q("Which word does not belong? generous · kind · charitable · selfish", ["selfish", "generous", "kind", "charitable"], 0, "It is the opposite of giving.", "Selfish contrasts with the other positive qualities."),
    ],
    hard: [
      q("Which is not a collective noun? flock · jury · bouquet · quickly", ["quickly", "flock", "jury", "bouquet"], 0, "It describes a manner.", "Quickly is an adverb, not a group noun."),
      q("Which pair is not an antonym pair? scarce / abundant · rigid / flexible · obscure / obvious · amplify / enlarge", ["amplify / enlarge", "scarce / abundant", "rigid / flexible", "obscure / obvious"], 0, "These two words are close in meaning.", "Amplify and enlarge are synonyms, not antonyms."),
      q("Which word is not derived from Greek? telephone · biography · microscope · bungalow", ["bungalow", "telephone", "biography", "microscope"], 0, "This word travelled from South Asia into English.", "Bungalow comes from Hindi via Gujarati."),
      q("Which is not a figure of speech? hyperbole · personification · onomatopoeia · paragraph", ["paragraph", "hyperbole", "personification", "onomatopoeia"], 0, "It is a unit of written text.", "A paragraph organizes prose; the others are rhetorical devices."),
      q("Which word does not share the Latin root meaning 'to carry'? transfer · portable · transport · translate", ["translate", "transfer", "portable", "transport"], 0, "It comes from a different Latin root.", "Translate comes from roots meaning carry across in a different linguistic sense; it is the odd choice in this everyday word family."),
      q("Which is not a grammatical mood? indicative · imperative · subjunctive · decorative", ["decorative", "indicative", "imperative", "subjunctive"], 0, "It describes appearance, not a verb form.", "Decorative is not a grammatical mood."),
    ],
  },
  "emoji-decoder": {
    easy: [
      q("📚🐛 means…", ["bookworm", "book a taxi", "worm farm", "library closed"], 0, "A person who loves reading.", "A bookworm is someone who enjoys books."),
      q("🌧️🐱🐶 means…", ["raining cats and dogs", "pets need umbrellas", "a wet zoo", "cloudy with kittens"], 0, "A very heavy rain idiom.", "It is raining cats and dogs means raining heavily."),
      q("🧊💔 means…", ["break the ice", "a cold heart", "freeze a feeling", "winter romance"], 0, "Start talking to ease the awkwardness.", "Breaking the ice makes a social situation more comfortable."),
      q("🐘🏠 means…", ["elephant in the room", "a tiny house", "zoo visit", "heavy furniture"], 0, "A big issue everyone avoids discussing.", "The elephant in the room is an obvious unspoken problem."),
      q("🌙🦉 means…", ["night owl", "moon bird", "late breakfast", "sleepy pilot"], 0, "Someone who stays awake late.", "A night owl is a person who is active late at night."),
      q("🦋🤢 means…", ["butterflies in your stomach", "insect lunch", "nervous tummy", "a garden bug"], 0, "A nervous feeling before something important.", "Butterflies in your stomach describe nervous excitement."),
    ],
    medium: [
      q("🫘🗣️ means…", ["spill the beans", "bean a speaker", "grow a rumour", "order a side dish"], 0, "Reveal information someone was keeping quiet.", "To spill the beans is to reveal a secret."),
      q("🦶❄️ means…", ["get cold feet", "winter walking", "freeze your shoes", "ice skating"], 0, "Lose confidence before doing something.", "Cold feet means becoming nervous or backing out."),
      q("🪙🫗 means…", ["money down the drain", "coin fountain", "wash your wallet", "buy a sink"], 0, "Waste money on something useless.", "Money down the drain is money wasted."),
      q("🐝🧢 means…", ["be in the know", "bee's knees", "busy as a bee", "hat for a bee"], 1, "A playful way to say excellent.", "The bee's knees means something or someone is excellent."),
      q("🪨🤐 means…", ["leave no stone unturned", "stone-cold silence", "talk to a rock", "rock the boat"], 0, "Search everywhere to find something.", "Leave no stone unturned means make every effort to find or do something."),
      q("🧺🥚🪺 means…", ["put all your eggs in one basket", "make an omelette", "protect a nest", "go to the market"], 0, "Rely on just one plan and risk everything.", "The idiom warns against putting all your resources into one option."),
    ],
    hard: [
      q("🦷👅 means…", ["hold your tongue", "bite your tongue", "tongue twister", "say it loudly"], 0, "Keep quiet instead of saying something.", "To hold your tongue means to stop yourself from speaking."),
      q("🧂🩹 means…", ["rub salt in the wound", "season a bandage", "heal with cooking", "a salty tear"], 0, "Make an already bad situation feel worse.", "It means intensifying someone's pain or embarrassment."),
      q("⏰🪙 means…", ["time is money", "buy a clock", "save an hour", "sell your watch"], 0, "Time is valuable and should be used wisely.", "Time is money compares the value of time with money."),
      q("🪶🦚 means…", ["proud as a peacock", "light as a feather", "feather your nest", "birds of a feather"], 0, "Very proud of yourself.", "Proud as a peacock describes someone showing great pride."),
      q("🪟👀 means…", ["window shopping", "watch your words", "look through someone", "open-minded"], 0, "Browse items without intending to buy.", "Window shopping means looking at goods for pleasure without purchasing."),
      q("🐴👄 means…", ["straight from the horse's mouth", "put the cart before the horse", "horse around", "hold your horses"], 0, "Information from the original, trusted source.", "It means getting information directly from the person who knows."),
    ],
  },
  "verb-vortex": {
    easy: [
      q("Yesterday, I ___ a new word.", ["learned", "learn", "learning", "will learn"], 0, "The time word tells you it already happened.", "Use the past tense learned with yesterday."),
      q("She ___ to the club every Friday.", ["goes", "go", "going", "gone"], 0, "For he, she, or it in the present, add -s or -es.", "The present simple is goes for she."),
      q("We ___ English right now.", ["are practising", "practise", "practised", "practises"], 0, "Right now signals an action in progress.", "Use are practising for a plural subject and an action happening now."),
      q("They ___ the match last week.", ["won", "win", "wins", "winning"], 0, "Last week puts the action in the past.", "Win becomes won in the past."),
      q("I ___ my homework every evening.", ["do", "does", "doing", "did"], 0, "The subject is I and the routine is present.", "Use do with I in the present simple."),
      q("He has ___ his lunch.", ["eaten", "ate", "eat", "eating"], 0, "After has, use the past participle.", "The past participle of eat is eaten."),
    ],
    medium: [
      q("By the time we arrived, the film ___.", ["had started", "has started", "starts", "will start"], 0, "One past action happened before another.", "Past perfect (had started) marks the earlier past action."),
      q("If I ___ more time, I would learn guitar.", ["had", "have", "will have", "am having"], 0, "This is an unreal or imagined present condition.", "Use past simple in the if-clause of this second conditional."),
      q("The letters ___ yesterday.", ["were sent", "sent", "are sending", "have send"], 0, "The subject receives the action.", "Use the passive past form were sent."),
      q("She ___ in Addis since 2022.", ["has lived", "lived", "is living", "had live"], 0, "Since links a past starting point to now.", "Present perfect connects the past with the present."),
      q("When I called, they ___ dinner.", ["were eating", "ate", "have eaten", "will eat"], 0, "The action was already in progress at that past moment.", "Past continuous describes an action in progress when another happened."),
      q("Neither the coach nor the players ___ ready.", ["were", "was", "is", "be"], 0, "With neither/nor, match the verb to the nearer plural subject.", "The verb agrees with players, the closer subject."),
    ],
    hard: [
      q("Had I known, I ___ earlier.", ["would have come", "will come", "came", "would come"], 0, "This imagines a different past.", "Third conditional uses would have + past participle."),
      q("It is vital that she ___ present.", ["be", "is", "was", "being"], 0, "Formal English uses the base form after this expression.", "The mandative subjunctive uses be."),
      q("No sooner ___ the bell rung than everyone stood up.", ["had", "has", "did", "was"], 0, "This formal structure inverts the auxiliary and subject.", "No sooner had…than uses past perfect inversion."),
      q("The committee ___ divided in their opinions.", ["are", "is", "was", "has"], 0, "In British English, a group acting as individuals can take a plural verb.", "Collective nouns can take plural agreement when members act separately."),
      q("She speaks as though she ___ the answer.", ["knew", "knows", "will know", "has know"], 0, "The comparison is hypothetical, not a confirmed fact.", "Were/knew forms are used for unreal comparisons; knew fits this sentence."),
      q("By next June, I ___ here for ten years.", ["will have worked", "work", "worked", "am working"], 0, "The action will reach a duration before a future point.", "Future perfect expresses completion or duration by a future time."),
    ],
  },
  "plural-panic": {
    easy: [
      q("One cat, two…", ["cats", "cates", "cat's", "caties"], 0, "Add -s to most nouns.", "The regular plural of cat is cats."),
      q("One box, three…", ["boxes", "boxs", "boxies", "boxen"], 0, "Words ending in x often add -es.", "Box becomes boxes."),
      q("One baby, two…", ["babies", "babys", "babyes", "babyeses"], 0, "Change consonant + y to -ies.", "Baby becomes babies."),
      q("One dish, two…", ["dishes", "dishs", "dishies", "dishen"], 0, "Add -es after sh.", "Dish becomes dishes."),
      q("One key, two…", ["keys", "keies", "keyes", "key's"], 0, "The y follows a vowel, so keep it.", "Key becomes keys."),
      q("One photo, two…", ["photos", "photoes", "photies", "photo's"], 0, "Some nouns ending in o simply add -s.", "Photo becomes photos."),
    ],
    medium: [
      q("One child, four…", ["children", "childs", "childrens", "childes"], 0, "This is an irregular plural.", "Child becomes children."),
      q("One mouse, two…", ["mice", "mouses", "mouse", "meese"], 0, "An irregular change swaps the vowel.", "The usual plural of mouse is mice."),
      q("One leaf, many…", ["leaves", "leafs", "leafes", "leavs"], 0, "Many f-ending nouns change f to v.", "Leaf becomes leaves."),
      q("One person, many…", ["people", "personses", "peoples", "person"], 0, "This common noun has a familiar irregular plural.", "People is the usual plural of person."),
      q("One tomato, several…", ["tomatoes", "tomatos", "tomatoies", "tomato's"], 0, "Many consonant + o nouns add -es.", "Tomato becomes tomatoes."),
      q("One woman, two…", ["women", "womans", "womanes", "womens"], 0, "The first vowel sound changes.", "Woman becomes women."),
    ],
    hard: [
      q("One criterion, several…", ["criteria", "criterions", "criterias", "criteriones"], 0, "This Greek-derived plural ends in -a.", "Criterion becomes criteria."),
      q("One analysis, two…", ["analyses", "analysises", "analysises", "analysi"], 0, "Change -is to -es.", "Analysis becomes analyses."),
      q("One phenomenon, several…", ["phenomena", "phenomenons", "phenomenas", "phenomenae"], 0, "This Greek-derived plural ends in -a.", "Phenomenon becomes phenomena."),
      q("One cactus, several (traditional plural)…", ["cacti", "cactuseses", "cactae", "cactis"], 0, "The Latin plural changes the ending.", "Cacti is a traditional plural; cactuses is also widely accepted."),
      q("One thesis, two…", ["theses", "thesises", "thesis", "thesae"], 0, "Change -is to -es.", "Thesis becomes theses."),
      q("One sheep, a whole…", ["flock of sheep", "flock of sheeps", "flock of sheepes", "flocks of sheeps"], 0, "Some animal plurals do not change form.", "Sheep is the same in singular and plural."),
    ],
  },
  "polite-or-chaos": {
    easy: [
      q("A friend is late. Which reply is kind and clear?", ["No worries—are you okay?", "You are always late.", "I knew you would fail.", "Don't bother coming."], 0, "Show care and ask a useful question.", "A calm, friendly reply keeps the conversation open."),
      q("You need help. What is a polite request?", ["Could you help me, please?", "Do this now.", "You must help me.", "Hey, you!"], 0, "A question plus please softens the request.", "Could you…please? is a polite request."),
      q("Someone says, 'Thank you!' You can answer…", ["You're welcome!", "Obviously.", "I know.", "About time."], 0, "A warm response closes the exchange.", "You're welcome is a natural polite reply."),
      q("You did not hear a name. What should you say?", ["Sorry, could you repeat the name?", "What?", "Speak clearly!", "Never mind."], 0, "Ask for the missing detail respectfully.", "A polite request invites the speaker to repeat it."),
      q("You disagree in a discussion. Try…", ["I see your point, but I think…", "That is ridiculous.", "You have no idea.", "Wrong. Next."], 0, "Acknowledge before explaining your view.", "Respectful disagreement focuses on ideas, not people."),
      q("You bump into someone. Say…", ["I'm sorry—are you all right?", "Watch where you are!", "That was your fault.", "Move!"], 0, "Apologise and check on them.", "A brief apology shows consideration."),
    ],
    medium: [
      q("A teammate missed a deadline. Best first response?", ["Can we check what got in the way and reset the plan?", "You have ruined everything.", "I'll tell everyone it was you.", "Forget the project."], 0, "Start with facts and a way forward.", "A constructive question finds the issue and a next step."),
      q("You need to interrupt politely. Say…", ["Excuse me—may I add something?", "Stop talking.", "My turn now.", "I have something more important."], 0, "Signal the interruption and ask permission.", "Excuse me and may I… soften an interruption."),
      q("Someone gives feedback you disagree with. Reply…", ["Thanks for explaining. Could you show me an example?", "Your feedback is useless.", "I don't care.", "You are wrong."], 0, "Ask for a concrete example before deciding.", "A curious question keeps feedback productive."),
      q("You cannot attend an event. Best response?", ["Thank you for inviting me. I can't make it, but I hope it goes well.", "No.", "Maybe, probably not.", "Don't ask again."], 0, "Thank the person, then give a clear answer.", "A polite decline is appreciative and direct."),
      q("A colleague made a small mistake. Say…", ["I spotted one small thing we can fix together.", "How did you not notice that?", "This is a disaster.", "I will do everything myself."], 0, "Focus on the fix, not blame.", "Specific, supportive feedback helps the team improve."),
      q("You need more time. Try…", ["Would it be possible to have until Friday?", "I will do it whenever.", "Stop asking me.", "It is not my problem."], 0, "Make a clear request with a date.", "A specific, respectful request is easier to answer."),
    ],
    hard: [
      q("A discussion is getting tense. What de-escalates it?", ["Let's pause and make sure we're solving the same problem.", "Everyone calm down—you are being childish.", "I am leaving and it is all your fault.", "Let's speak even louder."], 0, "Name a shared goal and offer a pause.", "A neutral reset helps people refocus without blame."),
      q("You need to correct someone's incorrect fact in public. Say…", ["I may have different information—shall we check the source together?", "That is completely false.", "You clearly did not read anything.", "I will prove you wrong."], 0, "Keep dignity intact and suggest verification.", "Collaborative fact-checking is firm and respectful."),
      q("A request is outside your capacity. Best answer?", ["I can't take that on today. I can help with X or revisit it tomorrow.", "Sure." , "No, because you always ask too much.", "Maybe, if I remember."], 0, "State a boundary and offer a realistic alternative.", "Clear limits plus an alternative are respectful and useful."),
      q("You want to raise a concern with a leader. Start with…", ["Could we discuss a concern about the schedule and its effect on the team?", "Your schedule is terrible.", "Everybody hates this.", "I refuse to follow anything."], 0, "Describe the topic and impact without exaggeration.", "A specific, neutral opening invites a useful conversation."),
      q("You realise your message sounded rude. What now?", ["I reread my message and see it came across harshly. I'm sorry.", "You misunderstood me.", "Forget what I said.", "I was just being honest."], 0, "Own the impact and apologise plainly.", "A direct apology takes responsibility instead of shifting blame."),
      q("A teammate proposes an idea you cannot support. Reply…", ["I understand the goal. My concern is X; could we consider Y?", "That idea is foolish.", "I will ignore it.", "Do whatever you want."], 0, "Recognise the goal, explain a concern, offer an option.", "This structure makes disagreement clear and constructive."),
    ],
  },
};

export function difficultyTier(level: number) {
  return Math.min(3, Math.max(1, 1 + Math.floor((Math.max(1, level) - 1) / 2)));
}

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

export function generateCrossword(seed: number, count = 10, difficulty = 3): Crossword {
  const rnd = mulberry32(seed);
  const eligible = CLUE_BANK.filter((entry) => difficulty <= 1 ? entry.word.length <= 8 : difficulty === 2 ? entry.word.length <= 11 : true);
  const pool = shuffleWith(eligible, rnd).slice(0, 28).sort((a, b) => b.word.length - a.word.length);
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
