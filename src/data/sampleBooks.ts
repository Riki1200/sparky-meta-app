import { BookPage, WordToken } from '../types';

/**
 * Splits text into clean word tokens while preserving display punctuation.
 */
export function createWordTokensFromText(text: string): WordToken[] {
  // Matches words with their surrounding or trailing punctuation
  const rawWords = text.trim().split(/\s+/);

  return rawWords.map((raw, idx) => {
    // Strip leading/trailing punctuation for the normalized phonetic match
    const clean = raw.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    const syllables = estimateSyllables(clean);

    return {
      id: `w_${idx}_${clean}`,
      word: clean,
      display: raw,
      status: 'pending',
      syllables,
    };
  });
}

/**
 * Heuristic syllable separation for English and Spanish
 */
function estimateSyllables(word: string): string[] {
  if (!word || word.length <= 3) return [word];

  const vowels = 'aeiouyáéíóúüAEIOUYÁÉÍÓÚÜäöëïÿàèìòùâêîôûãõąęóıöüÄÖÜ';
  const parts: string[] = [];
  let current = '';

  for (let i = 0; i < word.length; i++) {
    current += word[i];
    const isVowel = vowels.includes(word[i]);
    const nextIsConsonant = i + 1 < word.length && !vowels.includes(word[i + 1]);
    const afterNextIsVowel = i + 2 < word.length && vowels.includes(word[i + 2]);

    if (isVowel && nextIsConsonant && afterNextIsVowel && current.length >= 2) {
      parts.push(current);
      current = '';
    }
  }
  if (current) parts.push(current);
  return parts.length > 0 ? parts : [word];
}

export const SAMPLE_BOOK_PAGES: BookPage[] = [
  // ENGLISH BOOKS (DEFAULT)
  {
    id: 'hummingbird-journey',
    title: "The Little Hummingbird's Flight",
    source: 'Nature Tales for Young Readers',
    language: 'en',
    difficulty: 'Beginner',
    gradeLevel: 'Grade 1-2 (Early Reader)',
    text: 'A tiny hummingbird fluttered its colorful wings near the tall green trees. The morning breeze was fresh and gentle. With joyful courage, it found the sweetest flower in the sunlit garden.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'whispering-forest',
    title: 'The Whispering Forest and the Moon',
    source: 'Bedtime Classics for Children',
    language: 'en',
    difficulty: 'Intermediate',
    gradeLevel: 'Grade 2-3 (Intermediate)',
    text: 'Deep in the enchanted forest, the ancient oak tree whispered secrets to the stars. The silver moon shone brightly through the peaceful branches. Every woodland creature listened closely to the sweet song.',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'golden-lighthouse',
    title: 'Oliver and the Golden Lighthouse',
    source: 'Ocean Adventures for Kids',
    language: 'en',
    difficulty: 'Intermediate',
    gradeLevel: 'Grade 2-3 (Intermediate)',
    text: 'Oliver walked along the rocky shoreline at sunset. The golden lighthouse beamed a warm yellow light across the ocean waves. He felt brave knowing every ship was guided safely home.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // SPANISH BOOKS (CUENTOS DOMINICANOS Y LATINOAMERICANOS)
  {
    id: 'cibao-gallo',
    title: 'El Gallito Cantor del Cibao',
    source: 'Cuentos y Tradiciones Dominicanas',
    language: 'es',
    difficulty: 'Principiante',
    gradeLevel: '1er - 2do Grado (RD)',
    text: 'El gallito despertó antes de la madrugada. Subió a la cerca de madera y cantó con alegría. Sus plumas doradas brillaban con el resplandor del sol. Los niños del campo sonreían al escuchar su hermoso canto.',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'samana-tortuga',
    title: 'La Tortuga Viajera de Samaná',
    source: 'Fauna Dominicana Infantil',
    language: 'es',
    difficulty: 'Intermedio',
    gradeLevel: '2do - 3er Grado (RD)',
    text: 'La pequeña tortuga nadaba feliz en las aguas tibias de Samaná. Observaba las gigantescas ballenas jorobadas saltar sobre las olas azules. Con paciencia y valentía, llegó hasta la playa donde descansaban sus amigos.',
    imageUrl: 'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'bani-mango',
    title: 'El Mango Dulce de Baní',
    source: 'Lecturas de Primaria Quisqueya',
    language: 'es',
    difficulty: 'Intermedio',
    gradeLevel: '2do - 3er Grado (RD)',
    text: 'En el hermoso valle crecía un árbol de mangos dulces como la miel. Pedro y Sofía recolectaban las frutas maduras con mucho cuidado. Compartieron su cosecha con todos los vecinos en una fiesta inolvidable.',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // FRENCH BOOKS
  {
    id: 'colibri-matin',
    title: 'Le Petit Colibri du Matin',
    source: 'Contes de la Nature pour Enfants',
    language: 'fr',
    difficulty: 'Beginner',
    gradeLevel: 'CP - CE1 (Débutant)',
    text: 'Un petit colibri agitait ses ailes colorées près des grands arbres verts. La brise du matin était douce et fraîche. Avec un courage joyeux, il trouva la plus douce des fleurs dans le jardin ensoleillé.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'foret-etoiles',
    title: "La Forêt et la Lune d'Argent",
    source: 'Histoires du Soir pour Enfants',
    language: 'fr',
    difficulty: 'Intermediate',
    gradeLevel: 'CE1 - CE2 (Intermédiaire)',
    text: "Au fond de la forêt enchantée, le grand chêne chuchotait des secrets aux étoiles. La lune d'argent brillait paisiblement à travers les branches. Tous les animaux écoutaient cette douce mélodie.",
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // PORTUGUESE BOOKS
  {
    id: 'beija-flor-dourado',
    title: 'O Pequeno Beija-Flor Dourado',
    source: 'Contos da Natureza Infantil',
    language: 'pt',
    difficulty: 'Beginner',
    gradeLevel: '1º - 2º Ano (Iniciante)',
    text: 'Um pequeno beija-flor bateu suas asas coloridas perto das árvores verdes. A brisa da manhã era suave e fresca. Com muita coragem e alegria, ele encontrou a flor mais doce do jardim ensolarado.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'farol-dourado-pt',
    title: 'Lucas e o Farol Dourado',
    source: 'Aventuras do Oceano para Crianças',
    language: 'pt',
    difficulty: 'Intermediate',
    gradeLevel: '2º - 3º Ano (Intermediário)',
    text: 'Lucas caminhava pela praia ao pôr do sol. O farol dourado brilhava com uma luz amarela e quente sobre as ondas do oceano. Ele sentia alegria ao ver cada barco voltar em segurança para casa.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // GERMAN BOOKS
  {
    id: 'de-kolibri',
    title: 'Der kleine Kolibri und die Zauberblume',
    source: 'Naturmärchen für Kinder',
    language: 'de',
    difficulty: 'Beginner',
    gradeLevel: '1. - 2. Klasse (Grundschule)',
    text: 'Ein winziger Kolibri flatterte mit bunten Flügeln zwischen den grünen Bäumen. Die Morgenluft war frisch und friedlich. Mit frohem Mut fand er die süßeste Blume im sonnigen Garten.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'de-leuchtturm',
    title: 'Lukas und der goldene Leuchtturm',
    source: 'Klassische Abenteuer am Meer',
    language: 'de',
    difficulty: 'Intermediate',
    gradeLevel: '2. - 3. Klasse (Grundschule)',
    text: 'Lukas spazierte am felsigen Ufer im goldenen Licht der Abendsonne. Der Leuchtturm strahlte ein warmes gelbes Licht über die sanften Meereswellen. Er fühlte sich geborgen und glücklich.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // ITALIAN BOOKS
  {
    id: 'it-colibri',
    title: "Il Piccolo Colibrì e il Fiore d'Oro",
    source: 'Fiabe della Natura per Bambini',
    language: 'it',
    difficulty: 'Beginner',
    gradeLevel: '1ª - 2ª Elementare',
    text: 'Un piccolo colibrì sbatteva le ali colorate vicino ai grandi alberi verdi. La brezza del mattino era fresca e dolce. Con gioioso coraggio, trovò il fiore più profumato nel giardino illuminato dal sole.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'it-faro',
    title: 'Matteo e il Faro Dorato',
    source: 'Avventure del Mare per Piccoli',
    language: 'it',
    difficulty: 'Intermediate',
    gradeLevel: '2ª - 3ª Elementare',
    text: 'Matteo camminava lungo la riva rocciosa al tramonto. Il vecchio faro emanava una luce calda e dorata sopra le onde calme del mare. Sorrideva guardando le barche tornare sicure al porto.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // DUTCH BOOKS
  {
    id: 'nl-kolibrie',
    title: 'De Kleine Kolibrie en de Bloem',
    source: 'Natuurverhalen voor Jonge Lezers',
    language: 'nl',
    difficulty: 'Beginner',
    gradeLevel: 'Groep 3 - 4 (Basisschool)',
    text: 'Een piepkleine kolibrie fladderde met kleurrijke vleugels tussen de hoge groene bomen. De ochtendbries was heerlijk fris en zacht. Met een vrolijk hart vond het vogeltje de zoetste bloem in de zonnige tuin.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'nl-vuurtoren',
    title: 'Daan en de Gouden Vuurtoren',
    source: 'Klassieke Zeeavonturen',
    language: 'nl',
    difficulty: 'Intermediate',
    gradeLevel: 'Groep 4 - 5 (Basisschool)',
    text: 'Daan wandelde over het schelpenstrand tijdens de zonsondergang. De gouden vuurtoren scheen een warm geel licht over de golven van de zee. Ieder schip werd veilig naar de haven geleid.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // POLISH BOOKS
  {
    id: 'pl-koliber',
    title: 'Mały Koliber i Kolorowy Ogród',
    source: 'Bajki Przyrodnicze dla Dzieci',
    language: 'pl',
    difficulty: 'Beginner',
    gradeLevel: 'Klasa 1 - 2 (Wczesnoszkolna)',
    text: 'Malutki koliber trzepotał barwnymi skrzydełkami wśród wysokich zielonych drzew. Poranny wietrzyk był świeży i delikatny. Z radosną odwagą ptaszek odnalazł najsłodszy kwiat w słonecznym ogrodzie.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'pl-latarnia',
    title: 'Jaś i Złota Latarnia Morska',
    source: 'Morskie Opowieści dla Najmłodszych',
    language: 'pl',
    difficulty: 'Intermediate',
    gradeLevel: 'Klasa 2 - 3 (Średniozaawansowana)',
    text: 'Jaś spacerował wzdłuż kamienistego brzegu o zachodzie słońca. Złota latarnia morska rzucała ciepłe żółte światło na błękitne fale oceanu. Każdy statek bezpiecznie wracał do spokojnego portu.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },

  // TURKISH BOOKS
  {
    id: 'tr-sinekkusu',
    title: 'Küçük Sinek Kuşunun Uçuşu',
    source: 'Çocuklar İçin Doğa Masalları',
    language: 'tr',
    difficulty: 'Beginner',
    gradeLevel: '1. - 2. Sınıf (İlkokul)',
    text: 'Minik bir sinek kuşu yeşil ağaçların arasında rengarenk kanatlarını neşeyle çırptı. Sabah rüzgarı tatlı ve serindi. Cesur minik kuş, güneşli bahçedeki en tatlı çiçeği buldu.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
  {
    id: 'tr-fener',
    title: 'Emre ve Altın Deniz Feneri',
    source: 'Okyanus Maceraları Dizisi',
    language: 'tr',
    difficulty: 'Intermediate',
    gradeLevel: '2. - 3. Sınıf (İlkokul)',
    text: 'Emre gün batımında taşlı kumsalda yürüyordu. Altın renkli deniz feneri dalgaların üzerine sıcacık sarı bir ışık saçıyordu. Bütün teknelerin limana güvenle dönmesini izledi.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    words: [],
  },
];

// Initialize words for each sample page
SAMPLE_BOOK_PAGES.forEach((page) => {
  page.words = createWordTokensFromText(page.text);
});

