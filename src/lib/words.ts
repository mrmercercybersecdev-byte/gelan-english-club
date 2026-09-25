export type Word = {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
};

export const WORDS: Word[] = [
  { word: "serendipity", phonetic: "/ˌser.ənˈdɪp.ə.ti/", partOfSpeech: "noun", definition: "The fact of finding interesting or valuable things by chance.", example: "It was pure serendipity that we sat at the same table and became best friends." },
  { word: "eloquent", phonetic: "/ˈel.ə.kwənt/", partOfSpeech: "adjective", definition: "Giving a clear, strong message; fluent and persuasive in speaking.", example: "Her eloquent speech won the debate." },
  { word: "meticulous", phonetic: "/məˈtɪk.jə.ləs/", partOfSpeech: "adjective", definition: "Very careful and paying great attention to every detail.", example: "He keeps meticulous notes of every new phrase he learns." },
  { word: "resilient", phonetic: "/rɪˈzɪl.i.ənt/", partOfSpeech: "adjective", definition: "Able to recover quickly from difficult situations.", example: "Language learners must be resilient — mistakes are part of the journey." },
  { word: "ubiquitous", phonetic: "/juːˈbɪk.wɪ.təs/", partOfSpeech: "adjective", definition: "Seeming to be everywhere.", example: "English has become ubiquitous in science and technology." },
  { word: "candid", phonetic: "/ˈkæn.dɪd/", partOfSpeech: "adjective", definition: "Truthful and straightforward; frank.", example: "Thanks for your candid feedback on my pronunciation." },
  { word: "wanderlust", phonetic: "/ˈwɒn.də.lʌst/", partOfSpeech: "noun", definition: "A strong desire to travel.", example: "Learning English fuelled her wanderlust." },
  { word: "articulate", phonetic: "/ɑːˈtɪk.jə.lət/", partOfSpeech: "adjective", definition: "Able to express thoughts and feelings easily and clearly.", example: "After a year at the club, Tom became remarkably articulate." },
  { word: "cozy", phonetic: "/ˈkəʊ.zi/", partOfSpeech: "adjective", definition: "Comfortable, pleasant, and warm.", example: "We meet in a cozy café near the station." },
  { word: "perseverance", phonetic: "/ˌpɜː.sɪˈvɪə.rəns/", partOfSpeech: "noun", definition: "Continued effort to do something despite difficulties.", example: "Fluency comes with perseverance, not perfection." },
  { word: "quaint", phonetic: "/kweɪnt/", partOfSpeech: "adjective", definition: "Attractive in an unusual or old-fashioned way.", example: "We visited a quaint little village in the Cotswolds." },
  { word: "gregarious", phonetic: "/ɡrɪˈɡeə.ri.əs/", partOfSpeech: "adjective", definition: "Enjoying being with other people; sociable.", example: "Gregarious members love our Friday social nights." },
  { word: "nuance", phonetic: "/ˈnjuː.ɑːns/", partOfSpeech: "noun", definition: "A very slight difference in meaning, sound, or colour.", example: "Idioms help you understand the nuances of English." },
  { word: "brisk", phonetic: "/brɪsk/", partOfSpeech: "adjective", definition: "Quick, energetic and active.", example: "We went for a brisk walk and practised small talk." },
];

export function wordOfTheDay(date = new Date()): Word {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86_400_000);
  return WORDS[day % WORDS.length];
}
