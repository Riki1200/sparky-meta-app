import { ComprehensionQuestion, ReadingSessionResult, WordExplanation, SupportedLanguage } from '../types';
import { convertAudioBlobToWav16kMono } from './audioUtils';
import { getCloudVisionConsent, getCloudVoiceConsent } from './storageService';

const META_DIRECT_BASE_URL = 'https://api.meta.ai/v1';

export const META_API_CONFIG = {
  // Point this at server/meta-proxy.mjs so the API key never ships inside the app bundle
  baseUrl: process.env.EXPO_PUBLIC_META_API_BASE_URL || META_DIRECT_BASE_URL,
  // Only for quick local testing against the Meta API directly; anything EXPO_PUBLIC_ is visible to users
  apiKey: process.env.EXPO_PUBLIC_META_API_KEY || '',
  model: 'muse-spark-1.3',
  voiceModel: 'muse-voice-transcribe-1.0',
};

const usesProxy = META_API_CONFIG.baseUrl.replace(/\/+$/, '') !== META_DIRECT_BASE_URL;
const isMetaApiConfigured = () => usesProxy || !!META_API_CONFIG.apiKey;
const authHeaders = (): Record<string, string> =>
  META_API_CONFIG.apiKey ? { Authorization: `Bearer ${META_API_CONFIG.apiKey}` } : {};

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
  de: 'German',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
};

// Sparky coaches adults (18+): people learning to read, or reading in a new language
const sparkyPersona = (language: SupportedLanguage) =>
  `You are "Sparky", a patient and respectful Meta Muse Spark reading coach for adults who are learning to read or are reading in a new language. Speak to them as capable adults: warm and encouraging, never childish or condescending. Write your whole answer in ${LANGUAGE_NAMES[language]}.`;

/**
 * The UI uses vector icons only, and TTS reads emoji names aloud, so model output is kept emoji-free.
 */
function stripEmoji(text: string): string {
  return text.replace(/[ \t]*[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]+/gu, '');
}

/**
 * Call Meta Model API (Muse Spark) with OpenAI-compatible chat completions format.
 * Muse Spark uses internal reasoning tokens (~300-500 tokens), so max_tokens is generously sized.
 */
type MuseContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

async function callMuseSpark(
  messages: { role: 'system' | 'user' | 'assistant'; content: string | MuseContentPart[] }[],
  maxTokens: number = 1800
): Promise<string> {
  if (!isMetaApiConfigured()) {
    throw new Error('Meta API not configured. Run server/meta-proxy.mjs and set EXPO_PUBLIC_META_API_BASE_URL (see README).');
  }

  try {
    const response = await fetch(`${META_API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({
        model: META_API_CONFIG.model,
        messages,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Meta Model API request error:', response.status, errText);
      throw new Error(`Meta API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from Muse Spark');
    }
    return stripEmoji(content).trim();
  } catch (error) {
    console.error('callMuseSpark failed:', error);
    throw error;
  }
}

/**
 * Explain a difficult word to the reader using Muse Spark.
 */
export async function explainWordWithMuseSpark(
  word: string,
  sentenceContext: string,
  language: SupportedLanguage = 'en'
): Promise<WordExplanation> {
  const systemPrompt = `${sparkyPersona(language)}
Explain difficult words in plain, everyday language, with practical examples from adult life (work, home, shopping, health, family).
IMPORTANT: Respond ONLY with valid JSON with these keys (keep the keys in English):
{
  "simpleMeaning": "1 or 2 plain sentences explaining the word",
  "funExample": "A natural sentence from everyday adult life that uses the word",
  "syllables": "The word broken into syllables with hyphens (e.g. won-der-ful)",
  "encouragement": "A short, sincere and respectful note of encouragement"
}`;
  const userPrompt = `Explain the word "${word}".\nContext sentence: "${sentenceContext}".\nRespond strictly with the required JSON.`;

  try {
    const rawResponse = await callMuseSpark(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      1800
    );

    // Clean any markdown code fences if present
    const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      word,
      simpleMeaning: parsed.simpleMeaning || `A special and meaningful word in this story.`,
      funExample: parsed.funExample || '',
      syllables: parsed.syllables || word.split('').join('-'),
      encouragement: parsed.encouragement || 'Keep going, you are making progress.',
    };
  } catch (err) {
    console.warn('Falling back to local dictionary for word explanation:', err);
    return getLocalWordExplanation(word, language);
  }
}

/**
 * Generate gentle spoken feedback from Muse Spark after a reading session.
 */
export async function generateTutorSpokenFeedback(
  session: ReadingSessionResult
): Promise<string> {
  const lang = session.language;

  const systemPrompt = `${sparkyPersona(lang)}
The reader just finished reading a page aloud. Speak directly to them in 3-4 short sentences, plain text that sounds natural spoken aloud:
1. Acknowledge their effort and accuracy (${session.accuracyPercent}%).
2. Mention their reading pace (${session.wordsPerMinute} words per minute).
3. If there were difficult words (${session.errors.slice(0, 2).map(e => e.word).join(', ') || 'none'}), suggest practicing them, without pressure.
4. End with a brief, sincere note of encouragement.`;

  const userPrompt = `The reader read ${session.totalWords} words from "${session.pageTitle}". Accuracy was ${session.accuracyPercent}%. Give your spoken feedback.`;

  try {
    const feedback = await callMuseSpark(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      1800
    );
    return feedback;
  } catch (err) {
    console.warn('Fallback tutor feedback due to error:', err);
    const fallbacks: Record<SupportedLanguage, string> = {
      en: `Good work on this page. You reached ${session.accuracyPercent}% accuracy. A few minutes of practice each day makes reading easier and faster.`,
      es: `Buen trabajo con esta página. Llegaste a un ${session.accuracyPercent}% de precisión. Unos minutos de práctica cada día hacen que leer sea más fácil y rápido.`,
      fr: `Beau travail sur cette page. Vous avez atteint ${session.accuracyPercent}% de précision. Quelques minutes de pratique par jour rendent la lecture plus facile et plus rapide.`,
      pt: `Bom trabalho nesta página. Você chegou a ${session.accuracyPercent}% de precisão. Alguns minutos de prática por dia deixam a leitura mais fácil e rápida.`,
      de: `Gute Arbeit auf dieser Seite. Sie haben ${session.accuracyPercent}% Genauigkeit erreicht. Ein paar Minuten Übung am Tag machen das Lesen leichter und schneller.`,
      it: `Buon lavoro su questa pagina. Hai raggiunto il ${session.accuracyPercent}% di precisione. Pochi minuti di pratica al giorno rendono la lettura più facile e veloce.`,
      nl: `Goed gedaan met deze bladzijde. Je haalde ${session.accuracyPercent}% nauwkeurigheid. Elke dag een paar minuten oefenen maakt lezen makkelijker en sneller.`,
      pl: `Dobra robota z tą stroną. Osiągnięto ${session.accuracyPercent}% dokładności. Kilka minut ćwiczeń dziennie sprawia, że czytanie staje się łatwiejsze i szybsze.`,
      tr: `Bu sayfada iyi iş çıkardınız. %${session.accuracyPercent} doğruluğa ulaştınız. Her gün birkaç dakikalık pratik okumayı daha kolay ve hızlı hale getirir.`,
    };
    return fallbacks[lang] || fallbacks.en;
  }
}

/**
 * Generate 2-3 interactive comprehension questions about what the reader just read using Muse Spark.
 */
export async function generateComprehensionQuiz(
  pageText: string,
  language: SupportedLanguage = 'en'
): Promise<ComprehensionQuestion[]> {
  const systemPrompt = `${sparkyPersona(language)}
Create 2 clear reading comprehension questions based ONLY on the page the reader just read.
Respond STRICTLY with a valid JSON array (keep the keys in English):
[
  {
    "id": "q1",
    "question": "Clear question about the text?",
    "options": ["Option A", "Option B", "Option C"],
    "correctIndex": 0,
    "explanation": "Short explanation of why this answer is right"
  }
]`;
  const userPrompt = `Page text:\n"${pageText}"\nGenerate the 2 comprehension questions in JSON format.`;

  try {
    const raw = await callMuseSpark(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      1800
    );

    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3);
    }
    throw new Error('Invalid quiz array');
  } catch (err) {
    console.warn('Falling back to default comprehension questions:', err);
    return getLocalComprehensionQuestions(pageText, language);
  }
}

/**
 * Speech recognition via Muse Voice Transcribe (Meta Model API).
 * Accepts any audio Blob/ArrayBuffer, converts it to 16kHz mono 16-bit PCM WAV,
 * and calls https://api.meta.ai/v1/asr/transcribe with strictly conforming multipart parts.
 */
export async function transcribeAudioWithMuseVoice(
  audioData: Blob | ArrayBuffer,
  language: SupportedLanguage = 'en'
): Promise<string> {
  if (!isMetaApiConfigured()) {
    console.warn('transcribeAudioWithMuseVoice skipped: Meta API not configured');
    return '';
  }
  // Reading audio only leaves the device when the reader has allowed it in the Privacy Shield
  if (!(await getCloudVoiceConsent())) {
    return '';
  }

  try {
    let wavBlob: Blob;
    if (audioData instanceof Blob) {
      if (audioData.type === 'audio/wav' || audioData.type === 'audio/x-wav') {
        wavBlob = audioData;
      } else {
        wavBlob = await convertAudioBlobToWav16kMono(audioData);
      }
    } else {
      wavBlob = new Blob([audioData], { type: 'audio/wav' });
    }

    const formData = new FormData();
    const requestPayload = {
      model: META_API_CONFIG.voiceModel,
      audioEncoding: 'WAV',
      language,
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    );
    formData.append('audio', wavBlob, 'audio.wav');

    const response = await fetch(`${META_API_CONFIG.baseUrl}/asr/transcribe`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return (data.transcript || data.text || '').trim();
    } else {
      const errText = await response.text();
      console.warn('Muse Voice Transcribe API returned status:', response.status, errText);
    }
  } catch (err) {
    console.warn('Muse Voice Transcribe API request failed:', err);
  }
  return '';
}

/**
 * Answer the reader's voice question about the text using Muse Spark.
 */
export async function answerReaderVoiceQuestion(
  question: string,
  storyContext: string,
  language: SupportedLanguage = 'en'
): Promise<string> {
  const systemPrompt = `${sparkyPersona(language)}
The reader just asked you a question, with their own voice, about the text they are reading.
Answer in 2-3 clear, friendly sentences.`;
  const userPrompt = `Text context: "${storyContext}"\nReader's voice question: "${question}"`;

  try {
    const answer = await callMuseSpark(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // Muse Spark spends ~300-500 reasoning tokens first; a small budget leaves an empty answer
      1800
    );
    return answer;
  } catch (err) {
    console.warn('Sparky voice Q&A fallback:', err);
    const fallbacks: Record<SupportedLanguage, string> = {
      en: `Good question. I could not reach the tutor right now; try again in a moment, or keep reading and ask me again later.`,
      es: `Buena pregunta. Ahora mismo no pude conectar con el tutor; inténtalo de nuevo en un momento o sigue leyendo y vuelve a preguntarme.`,
      fr: `Bonne question. Je n'ai pas pu joindre le tuteur pour le moment ; réessayez dans un instant ou continuez à lire et reposez-la plus tard.`,
      pt: `Boa pergunta. Não consegui falar com o tutor agora; tente de novo em instantes ou continue lendo e pergunte depois.`,
      de: `Gute Frage. Ich konnte den Tutor gerade nicht erreichen; versuchen Sie es gleich noch einmal oder lesen Sie weiter und fragen Sie später.`,
      it: `Bella domanda. Non sono riuscito a contattare il tutor in questo momento; riprova tra poco o continua a leggere e chiedimelo più tardi.`,
      nl: `Goede vraag. Ik kon de tutor nu niet bereiken; probeer het zo opnieuw, of lees verder en vraag het later nog eens.`,
      pl: `Dobre pytanie. Nie udało się teraz połączyć z tutorem; spróbuj ponownie za chwilę albo czytaj dalej i zapytaj później.`,
      tr: `Güzel soru. Şu anda eğitmene ulaşamadım; birazdan tekrar deneyin ya da okumaya devam edip daha sonra yeniden sorun.`,
    };
    return fallbacks[language] || fallbacks.en;
  }
}

/**
 * Local fallback explanations for common difficult words.
 */
function getLocalWordExplanation(word: string, language: SupportedLanguage = 'en'): WordExplanation {
  const clean = word.toLowerCase().replace(/[.,!?:;«»]/g, '');

  if (language === 'es') {
    const spanishDict: Record<string, { meaning: string; example: string; syl: string }> = {
      asombroso: { meaning: 'Algo tan increíble que te deja con la boca abierta de la emoción.', example: '¡Fue asombroso ver fuegos artificiales en el cielo!', syl: 'a-som-bro-so' },
      madrugada: { meaning: 'El momento más temprano del día, cuando el sol apenas empieza a despertar.', example: 'El gallo canta en la madrugada para despertar al campo.', syl: 'ma-dru-ga-da' },
      resplandor: { meaning: 'Una luz muy brillante y bonita que ilumina todo a su alrededor.', example: 'El resplandor de las estrellas iluminaba el camino.', syl: 'res-plan-dor' },
      valentía: { meaning: 'Tener ánimo y fuerza en el corazón para intentar cosas difíciles.', example: 'Tuviste mucha valentía al leer esta página tan larga.', syl: 'va-len-tí-a' },
      curioso: { meaning: 'Tener muchas ganas de aprender, explorar y descubrir secretos.', example: 'Una persona curiosa siempre hace preguntas.', syl: 'cu-rio-so' },
    };

    const entry = spanishDict[clean] || {
      meaning: `Una palabra interesante que describe algo especial en el cuento.`,
      example: `Puedes usar "${clean}" cuando le cuentes esta aventura a tu familia.`,
      syl: clean.split('').join('-'),
    };

    return {
      word,
      simpleMeaning: entry.meaning,
      funExample: entry.example,
      syllables: entry.syl,
      encouragement: '¡Eres un lector muy inteligente y curioso!',
    };
  } else if (language === 'fr') {
    return {
      word,
      simpleMeaning: `Un mot merveilleux qui rend l'histoire encore plus vivante !`,
      funExample: `Tu peux employer "${clean}" pour raconter cette aventure à tes amis.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Continue comme ça, tu lis magnifiquement bien !',
    };
  } else if (language === 'pt') {
    return {
      word,
      simpleMeaning: `Uma palavra muito especial que enriquece a história que você leu!`,
      funExample: `Você pode usar "${clean}" quando compartilhar essa história com a família.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Você é um leitor brilhante e muito dedicado!',
    };
  } else if (language === 'de') {
    return {
      word,
      simpleMeaning: `Ein wunderbares Wort, das die Geschichte noch spannender macht!`,
      funExample: `Du kannst "${clean}" verwenden, wenn du deinen Freunden von der Geschichte erzählst.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Du machst das spitze, weiter so!',
    };
  } else if (language === 'it') {
    return {
      word,
      simpleMeaning: `Una parola bellissima che arricchisce la storia che hai letto!`,
      funExample: `Puoi usare "${clean}" per raccontare questa avventura alla tua famiglia.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Bravissimo, stai leggendo davvero benissimo!',
    };
  } else if (language === 'nl') {
    return {
      word,
      simpleMeaning: `Een prachtig woord dat het verhaal nog vrolijker maakt!`,
      funExample: `Je kunt "${clean}" gebruiken als je over dit avontuur vertelt.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Wat knap van jou, ga zo door!',
    };
  } else if (language === 'pl') {
    return {
      word,
      simpleMeaning: `Wyjątkowe słowo, które sprawia, że ta bajka jest taka barwna!`,
      funExample: `Możesz użyć słowa "${clean}", gdy będziesz opowiadać tę historię bliskim.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Wspaniale Ci idzie, jesteś super czytelnikiem!',
    };
  } else if (language === 'tr') {
    return {
      word,
      simpleMeaning: `Bu hikayeyi daha da güzelleştiren çok özel bir kelime!`,
      funExample: `Bu macerayı arkadaşlarına anlatırken "${clean}" kelimesini kullanabilirsin.`,
      syllables: clean.split('').join('-'),
      encouragement: 'Harikasın, her gün daha güzel okuyorsun!',
    };
  }

  // English fallback (default)
  return {
    word,
    simpleMeaning: `I could not load an explanation for "${word}" right now. Tap the speaker to hear it, and try again in a moment.`,
    funExample: '',
    syllables: word.split('').join('-'),
    encouragement: 'Keep going, you are making progress.',
  };
}

/**
 * Local fallback comprehension questions.
 */
function getLocalComprehensionQuestions(pageText: string, language: SupportedLanguage = 'en'): ComprehensionQuestion[] {
  if (language === 'es') {
    return [
      {
        id: 'q1',
        question: '¿De qué trata principalmente esta hermosa parte del libro?',
        options: ['De una gran aventura con amigos', 'De una receta de cocina', 'De un viaje al espacio en nave'],
        correctIndex: 0,
        explanation: '¡Exacto! El texto nos cuenta una aventura llena de momentos emocionantes.',
      },
      {
        id: 'q2',
        question: '¿Qué actitud tuvieron los personajes en la historia?',
        options: ['Fueron valientes y amables', 'Se quedaron dormidos todo el día', 'Estaban enojados sin razón'],
        correctIndex: 0,
        explanation: '¡Muy bien! Los personajes demostraron valentía y alegría al enfrentar su día.',
      },
    ];
  } else if (language === 'fr') {
    return [
      {
        id: 'q1',
        question: "De quoi parle principalement cette partie de l'histoire ?",
        options: ['Une aventure pleine de découvertes', 'Une recette de gâteau', 'Un voyage en fusée'],
        correctIndex: 0,
        explanation: "Bravo ! L'histoire raconte une aventure poétique et pleine de courage.",
      },
      {
        id: 'q2',
        question: "Comment se sentait le personnage principal ?",
        options: ['Courageux et enthousiaste', 'Endormi et triste', 'Fâché'],
        correctIndex: 0,
        explanation: "Exact ! Il avançait avec enthousiasme et joie.",
      },
    ];
  } else if (language === 'pt') {
    return [
      {
        id: 'q1',
        question: 'Sobre o que é principalmente essa parte da história?',
        options: ['Uma aventura inspiradora', 'Uma receita culinária', 'Um jogo de futebol'],
        correctIndex: 0,
        explanation: 'Parabéns! O texto nos conta uma linda aventura na natureza.',
      },
      {
        id: 'q2',
        question: 'Qual atitude o personagem demonstrou?',
        options: ['Coragem e alegria', 'Cansaço extremo', 'Desânimo'],
        correctIndex: 0,
        explanation: 'Muito bem! Demonstrou muita coragem e curiosidade.',
      },
    ];
  } else if (language === 'de') {
    return [
      {
        id: 'q1',
        question: 'Worum geht es hauptsächlich in dieser Geschichte?',
        options: ['Um ein schönes Naturabenteuer', 'Um ein Rezept für einen Kuchen', 'Um ein Raumschiff'],
        correctIndex: 0,
        explanation: 'Klasse! Es geht um ein wunderbares Abenteuer in der Natur.',
      },
      {
        id: 'q2',
        question: 'Wie verhielten sich die Figuren in der Geschichte?',
        options: ['Mutig und fröhlich', 'Sehr müde', 'Wütend'],
        correctIndex: 0,
        explanation: 'Ganz genau! Sie waren voller Lebensfreude und Mut.',
      },
    ];
  } else if (language === 'it') {
    return [
      {
        id: 'q1',
        question: 'Di cosa parla principalmente questa bella storia?',
        options: ["Di un'avventura nella natura", 'Di una ricetta di cucina', 'Di un viaggio su Marte'],
        correctIndex: 0,
        explanation: "Esatto! È una splendida avventura ricca di magia naturale.",
      },
      {
        id: 'q2',
        question: 'Come si sentiva il protagonista?',
        options: ['Coraggioso e pieno di gioia', 'Annoiatissimo', 'Arrabbiato'],
        correctIndex: 0,
        explanation: 'Bravissimo! Ha affrontato la giornata con coraggio e allegria.',
      },
    ];
  } else if (language === 'nl') {
    return [
      {
        id: 'q1',
        question: 'Waar gaat dit vrolijke verhaal vooral over?',
        options: ['Een spannend avontuur in de natuur', 'Een recept voor pannenkoeken', 'Een raketvlucht'],
        correctIndex: 0,
        explanation: 'Helemaal goed! Het vertelt over een prachtig avontuur.',
      },
      {
        id: 'q2',
        question: 'Hoe voelde het personage zich?',
        options: ['Dapper en vrolijk', 'Verveeld en moe', 'Boos'],
        correctIndex: 0,
        explanation: 'Super! Het personage toonde veel moed en vrolijkheid.',
      },
    ];
  } else if (language === 'pl') {
    return [
      {
        id: 'q1',
        question: 'O czym opowiada ten fragment bajki?',
        options: ['O pięknej przygodzie w naturze', 'O pieczeniu szarlotki', 'O locie na księżyc'],
        correctIndex: 0,
        explanation: 'Brawo! To opowieść o radosnej i odważnej przygodzie.',
      },
      {
        id: 'q2',
        question: 'Jak zachowywał się główny bohater?',
        options: ['Był odważny i pełen radości', 'Spał przez cały dzień', 'Był zły'],
        correctIndex: 0,
        explanation: 'Znakomicie! Bohater wykazał się wielką odwagą.',
      },
    ];
  } else if (language === 'tr') {
    return [
      {
        id: 'q1',
        question: 'Bu hikaye temel olarak ne hakkındadır?',
        options: ['Doğada geçen güzel bir macera', 'Çikolatalı kek tarifi', 'Uzaya yolculuk'],
        correctIndex: 0,
        explanation: 'Harika! Doğanın güzelliklerini anlatan sıcacık bir macera.',
      },
      {
        id: 'q2',
        question: 'Karakterimiz nasıl davranıyordu?',
        options: ['Cesur ve neşeli', 'Çok uykulu', 'Kızgın'],
        correctIndex: 0,
        explanation: 'Tebrikler! Büyük bir cesaret ve merakla hareket ediyordu.',
      },
    ];
  }

  // English fallback (default)
  return [
    {
      id: 'q1',
      question: 'What is this part of the story mostly about?',
      options: ['An exciting adventure in nature', 'A recipe for chocolate cake', 'A spaceship landing'],
      correctIndex: 0,
      explanation: 'Great job! The story tells us about an exciting adventure.',
    },
    {
      id: 'q2',
      question: 'How did the character feel while exploring?',
      options: ['Curious and brave', 'Bored and sleepy', 'Scared of everything'],
      correctIndex: 0,
      explanation: 'Super! The characters were curious and courageous throughout.',
    },
  ];
}

/**
 * Reads the story text from a photo of a physical book page with Muse Spark vision.
 * Only runs when the reader allowed it; returns '' so callers fall back to on-device OCR.
 */
export async function readBookPageWithMuseSpark(
  imageDataUrl: string,
  language: SupportedLanguage = 'en'
): Promise<string> {
  if (!isMetaApiConfigured() || !(await getCloudVisionConsent())) {
    return '';
  }

  const answer = await callMuseSpark([
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            `This is a photo of a printed page (a book, letter, notice or similar) written in ${LANGUAGE_NAMES[language] || 'English'}. ` +
            'Transcribe exactly the main text in reading order, keeping punctuation. ' +
            'Ignore page numbers, headers and any words inside illustrations. ' +
            'Reply with only the text. If there is no readable text, reply NONE.',
        },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ]);

  const text = answer.replace(/\s+/g, ' ').trim();
  return /^NONE\.?$/i.test(text) ? '' : text;
}
