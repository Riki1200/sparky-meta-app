import { ComprehensionQuestion, ReadingSessionResult, WordExplanation, SupportedLanguage } from '../types';
import { convertAudioBlobToWav16kMono } from './audioUtils';
import { getCloudVoiceConsent } from './storageService';

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
async function callMuseSpark(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], maxTokens: number = 1800): Promise<string> {
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
 * Explain a difficult word to a child using Muse Spark.
 */
export async function explainWordWithMuseSpark(
  word: string,
  sentenceContext: string,
  language: SupportedLanguage = 'en'
): Promise<WordExplanation> {
  const systemPromptMap: Record<SupportedLanguage, string> = {
    en: `You are "Sparky", a patient, warm, and playful Meta Muse Spark AI reading tutor for 6-10 year old children.
Your job is to explain difficult words simply, with fun metaphors and examples a child immediately grasps.
IMPORTANT: Respond ONLY with valid JSON with these keys:
{
  "simpleMeaning": "1 or 2 sentence simple explanation for a kid",
  "funExample": "A fun or funny real-life example using the word",
  "syllables": "The word broken into syllables with hyphens (e.g. won-der-ful)",
  "encouragement": "A short, cheerful encouraging cheer for the child"
}`,
    es: `Eres "Sparky", un tutor de lectura con inteligencia artificial de Meta Muse Spark, paciente, cariñoso y divertido para niños de 6 a 10 años en República Dominicana y Latinoamérica.
Tu misión es explicar palabras difíciles de manera súper simple, usando analogías divertidas y ejemplos que un niño entienda al instante.
IMPORTANTE: Responde ÚNICAMENTE en formato JSON válido con las siguientes claves:
{
  "simpleMeaning": "Explicación en 1 o 2 oraciones muy claras para un niño",
  "funExample": "Un ejemplo divertido o gracioso con la palabra",
  "syllables": "La palabra dividida en sílabas separadas por guiones (ej. a-som-bro-so)",
  "encouragement": "Una frase corta de ánimo con cariño dominicano o latino (ej. ¡Lo estás haciendo súper bien, campeón!)"
}`,
    fr: `Tu es "Sparky", un tuteur de lecture bienveillant propulsé par Meta Muse Spark pour enfants de 6 à 10 ans.
Ta mission est d'expliquer les mots difficiles simplement avec des métaphores joyeuses.
IMPORTANT : Réponds UNIQUEMENT en format JSON valide avec ces clés :
{
  "simpleMeaning": "Explication simple en 1 ou 2 phrases pour un enfant",
  "funExample": "Un exemple amusant et concret avec ce mot",
  "syllables": "Le mot découpé en syllabes avec des tirets (ex. mer-veil-leux)",
  "encouragement": "Une petite phrase joyeuse d'encouragement"
}`,
    pt: `Você é "Sparky", um tutor de leitura carinhoso e paciente da Meta Muse Spark para crianças de 6 a 10 anos.
Sua missão é explicar palavras difíceis de forma simples e divertida.
IMPORTANTE: Responda SOMENTE em formato JSON válido com estas chaves:
{
  "simpleMeaning": "Explicação simples em 1 ou 2 frases para a criança",
  "funExample": "Um exemplo divertido do dia a dia com a palavra",
  "syllables": "A palavra dividida em sílabas com hifens (ex. a-leg-ri-a)",
  "encouragement": "Uma frase curta e calorosa de incentivo"
}`,
    de: `Du bist "Sparky", ein herzlicher und geduldiger KI-Lesetutor von Meta Muse Spark für Kinder von 6 bis 10 Jahren.
Erkläre schwierige Wörter kinderleicht mit fröhlichen Vergleichen.
WICHTIG: Antworte NUR in gültigem JSON mit diesen Schlüsseln:
{
  "simpleMeaning": "Einfache Erklärung in 1-2 Sätzen für ein Kind",
  "funExample": "Ein lustiges, alltägliches Beispiel mit diesem Wort",
  "syllables": "Das Wort in Silben getrennt mit Bindestrich (z.B. wun-der-voll)",
  "encouragement": "Ein fröhlicher kurzer Anfeuerungsruf"
}`,
    it: `Sei "Sparky", un affettuoso e paziente tutor di lettura IA di Meta Muse Spark per bambini di 6-10 anni.
Spiega le parole difficili in modo semplicissimo e giocoso.
IMPORTANTE: Rispondi SOLO in formato JSON valido con queste chiavi:
{
  "simpleMeaning": "Spiegazione semplice in 1 o 2 frasi adatta a un bambino",
  "funExample": "Un esempio divertente e reale con questa parola",
  "syllables": "La parola divisa in sillabe con trattini (es. splen-di-do)",
  "encouragement": "Un breve e caloroso incoraggiamento"
}`,
    nl: `Je bent "Sparky", een warme en geduldige AI-leestutor van Meta Muse Spark voor kinderen van 6 tot 10 jaar.
Leg moeilijke woorden eenvoudig uit met vrolijke voorbeelden.
BELANGRIJK: Antwoord UITSLUITEND in geldig JSON met deze velden:
{
  "simpleMeaning": "Eenvoudige uitleg in 1 of 2 zinnen voor een kind",
  "funExample": "Een leuk herkenbaar voorbeeld met dit woord",
  "syllables": "Het woord verdeeld in lettergrepen met koppeltekens (bijv. vlin-der)",
  "encouragement": "Een enthousiaste bemoedigende kreet"
}`,
    pl: `Jesteś "Sparky", ciepłym i cierpliwym korepetytorem czytania AI Meta Muse Spark dla dzieci w wieku 6-10 lat.
Wyjaśniaj trudne słowa w prosty, bajkowy sposób.
WAŻNE: Odpowiedz WYŁĄCZNIE w poprawnym formacie JSON z następującymi polami:
{
  "simpleMeaning": "Proste wyjaśnienie w 1-2 zdaniach dla dziecka",
  "funExample": "Zabawny, ciekawy przykład z życia z tym słowem",
  "syllables": "Słowo podzielone na sylaby myślnikami (np. cu-dow-nie)",
  "encouragement": "Krótkie, radosne słowa pochwały"
}`,
    tr: `Sen 6-10 yaş arası çocuklar için Meta Muse Spark ile güçlendirilmiş sevecen ve sabırlı okuma eğitmeni "Sparky"sin.
Zor kelimeleri çocukların hemen anlayacağı eğlenceli örneklerle açıkla.
ÖNEMLİ: YALNIZCA şu anahtarları içeren geçerli bir JSON formatında yanıt ver:
{
  "simpleMeaning": "Bir çocuk için 1-2 cümlelik basit ve net açıklama",
  "funExample": "Bu kelimeyi içeren eğlenceli ve gerçekçi bir örnek",
  "syllables": "Kelimenin tirelerle ayrılmış heceli hali (ör. ke-le-bek)",
  "encouragement": "Çocuk için neşeli ve motive edici bir tebrik"
}`,
  };

  const userPromptMap: Record<SupportedLanguage, string> = {
    en: `Explain the word "${word}" to the child.\nContext sentence: "${sentenceContext}".\nRespond strictly with the required JSON.`,
    es: `Explícale al niño la palabra "${word}".\nAparece en esta oración: "${sentenceContext}".\nResponde solo con el JSON requerido.`,
    fr: `Explique à l'enfant le mot "${word}".\nContexte : "${sentenceContext}".\nRéponds strictement avec le JSON requis.`,
    pt: `Explique para a criança a palavra "${word}".\nContexto: "${sentenceContext}".\nResponda estritamente com o JSON solicitado.`,
    de: `Erkläre dem Kind das Wort "${word}".\nKontext: "${sentenceContext}".\nAntworte strikt im geforderten JSON-Format.`,
    it: `Spiega al bambino la parola "${word}".\nContesto: "${sentenceContext}".\nRispondi rigorosamente nel formato JSON richiesto.`,
    nl: `Leg aan het kind het woord "${word}" uit.\nContext: "${sentenceContext}".\nAntwoord strikt in het gevraagde JSON-formaat.`,
    pl: `Wyjaśnij dziecku słowo "${word}".\nKontekst: "${sentenceContext}".\nOdpowiedz ściśle w wymaganym formacie JSON.`,
    tr: `Çocuğa "${word}" kelimesini açıkla.\nBağlam: "${sentenceContext}".\nYalnızca istenen JSON formatında yanıt ver.`,
  };

  const systemPrompt = systemPromptMap[language] || systemPromptMap.en;
  const userPrompt = userPromptMap[language] || userPromptMap.en;

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
      funExample: parsed.funExample || `Like discovering a sparkling treasure!`,
      syllables: parsed.syllables || word.split('').join('-'),
      encouragement: parsed.encouragement || `Keep shining, reading superstar!`,
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

  const systemPromptMap: Record<SupportedLanguage, string> = {
    en: `You are "Sparky", a warm and patient Meta Muse Spark AI reading tutor speaking directly to a young reader who just finished reading aloud.
Keep it warm, energetic, and concise (3-4 sentences max so it sounds great spoken aloud):
1. Cheer for their effort and accuracy (${session.accuracyPercent}%).
2. Mention their reading speed (${session.wordsPerMinute} WPM).
3. Gently encourage practicing tricky words if any (${session.errors.slice(0, 2).map(e => e.word).join(', ') || 'none'}).
4. End with a joyful cheer!`,
    es: `Eres "Sparky", el tutor de lectura paciente de Meta Muse Spark. Estás hablando directamente al niño después de que terminó de leer una página en voz alta.
Hablas con un tono cálido, entusiasta, cariñoso y motivador (estilo amigable caribeño/latino: "¡Mi querido lector!", "¡Qué orgullo!").
Mantén el mensaje CORTO (3 a 4 oraciones máximo):
1. Felicita con alegría su esfuerzo y porcentaje de precisión (${session.accuracyPercent}%).
2. Menciona algo positivo de su velocidad (${session.wordsPerMinute} palabras por minuto).
3. Si tuvo palabras difíciles (${session.errors.length > 0 ? session.errors.map(e => e.word).slice(0, 2).join(', ') : 'ninguna'}), anímalo con dulzura a repasarlas.
4. Termina con una gran porra de ánimo.`,
    fr: `Tu es "Sparky", le tuteur de lecture bienveillant de Meta Muse Spark. Tu parles directement à l'enfant qui vient de lire à voix haute.
Reste chaleureux, dynamique et court (3-4 phrases max) :
1. Félicite ses efforts et sa précision (${session.accuracyPercent}%).
2. Mentionne sa vitesse de lecture (${session.wordsPerMinute} mots/minute).
3. Encourage avec douceur la pratique des mots difficiles s'il y en a.
4. Conclus avec un encouragement très positif !`,
    pt: `Você é "Sparky", o tutor de leitura acolhedor da Meta Muse Spark falando com a criança que acabou de ler em voz alta.
Fale com entusiasmo e carinho (3 a 4 frases curtas):
1. Parabenize pelo esforço e pela precisão (${session.accuracyPercent}%).
2. Elogie a velocidade de leitura (${session.wordsPerMinute} palavras por minuto).
3. Incentive com doçura a praticar as palavras mais difíceis.
4. Termine com uma mensagem muito alegre!`,
    de: `Du bist "Sparky", der liebevolle KI-Lesetutor von Meta Muse Spark, der direkt mit dem Kind spricht.
Sprich fröhlich und motivierend (3-4 kurze Sätze):
1. Lobe den Fleiß und die Genauigkeit (${session.accuracyPercent}%).
2. Erwähne das Lesetempo (${session.wordsPerMinute} Wörter pro Minute).
3. Ermutige sanft zum Wiederholen schwieriger Wörter.
4. Schließe mit einem herzlichen Hurra!`,
    it: `Sei "Sparky", il caloroso tutor di lettura di Meta Muse Spark che parla direttamente al bambino.
Usa un tono entusiasta e affettuoso (3-4 frasi brevi):
1. Congratulati per l'impegno e la precisione (${session.accuracyPercent}%).
2. Loda la velocità di lettura (${session.wordsPerMinute} parole al minuto).
3. Incoraggia con dolcezza a ripassare le parole più impegnative.
4. Concludi con un grande evviva!`,
    nl: `Je bent "Sparky", de vrolijke AI-leestutor van Meta Muse Spark die tegen het kind praat.
Blijf warm en enthousiast (3-4 korte zinnen):
1. Feliciteer met de inzet en nauwkeurigheid (${session.accuracyPercent}%).
2. Noem de mooie leessnelheid (${session.wordsPerMinute} woorden per minuut).
3. Moedig zachtjes aan om even te oefenen met lastige woorden.
4. Sluit af met een blije aanmoediging!`,
    pl: `Jesteś "Sparky", serdecznym korepetytorem czytania Meta Muse Spark rozmawiającym bezpośrednio z dzieckiem.
Mów ciepło i z radością (3-4 krótkie zdania):
1. Pogratuluj wielkiego wysiłku i dokładności (${session.accuracyPercent}%).
2. Pochwal tempo czytania (${session.wordsPerMinute} słów na minutę).
3. Zachęć z uśmiechem do powtórzenia trudniejszych słówek.
4. Zakończ radosnym zawołaniem!`,
    tr: `Sen sesli okumayı yeni tamamlamış minik okurla konuşan sevecen Meta Muse Spark okuma eğitmeni "Sparky"sin.
Neşeli ve cesaretlendirici bir tonla konuş (en fazla 3-4 cümle):
1. Çocuğun çabasını ve doğruluk oranını (%${session.accuracyPercent}) coşkuyla tebrik et.
2. Okuma hızını (${session.wordsPerMinute} kelime/dakika) öv.
3. Varsa zorlandığı kelimeleri tekrar etmesi için tatlı bir cesaret ver.
4. Neşeli bir tebrikle bitir!`,
  };

  const userPromptMap: Record<SupportedLanguage, string> = {
    en: `The child read ${session.totalWords} words from "${session.pageTitle}". Accuracy was ${session.accuracyPercent}%. Give them your warm spoken feedback.`,
    es: `El niño leyó ${session.totalWords} palabras del libro "${session.pageTitle}". Precisión ${session.accuracyPercent}%. Dale su mensaje de voz alentador.`,
    fr: `L'enfant a lu ${session.totalWords} mots de "${session.pageTitle}". Précision ${session.accuracyPercent}%. Donne-lui ton retour vocal bienveillant.`,
    pt: `A criança leu ${session.totalWords} palavras de "${session.pageTitle}". Precisão de ${session.accuracyPercent}%. Dê seu feedback carinhoso em voz alta.`,
    de: `Das Kind hat ${session.totalWords} Wörter aus "${session.pageTitle}" gelesen. Genauigkeit war ${session.accuracyPercent}%. Gib dein herzliches Feedback.`,
    it: `Il bambino ha letto ${session.totalWords} parole da "${session.pageTitle}". Precisione del ${session.accuracyPercent}%. Dagli il tuo incoraggiamento.`,
    nl: `Het kind las ${session.totalWords} woorden uit "${session.pageTitle}". Nauwkeurigheid was ${session.accuracyPercent}%. Geef je gesproken aanmoediging.`,
    pl: `Dziecko przeczytało ${session.totalWords} słów z książki "${session.pageTitle}". Dokładność ${session.accuracyPercent}%. Przekaż mu głosową pochwałę.`,
    tr: `Çocuk "${session.pageTitle}" kitabından ${session.totalWords} kelime okudu. Doğruluk %${session.accuracyPercent}. Ona sesli tebriğini ilet.`,
  };

  try {
    const feedback = await callMuseSpark(
      [
        { role: 'system', content: systemPromptMap[lang] || systemPromptMap.en },
        { role: 'user', content: userPromptMap[lang] || userPromptMap.en },
      ],
      1800
    );
    return feedback;
  } catch (err) {
    console.warn('Fallback tutor feedback due to error:', err);
    const fallbacks: Record<SupportedLanguage, string> = {
      en: `What a wonderful reading session! You showed so much courage and reached ${session.accuracyPercent}% accuracy. Every day you practice, your reading superpowers grow stronger!`,
      es: `¡Qué lectura tan maravillosa, amiguito! Leíste con mucha valentía y alcanzaste un ${session.accuracyPercent}% de precisión. ¡Cada día lees más fluido! Vamos a seguir descubriendo historias juntos.`,
      fr: `Quelle magnifique lecture ! Tu as fait preuve de beaucoup de courage et atteint ${session.accuracyPercent}% de précision. Chaque jour, tu deviens un lecteur encore plus extraordinaire !`,
      pt: `Que leitura maravilhosa! Você mostrou muita dedicação e alcançou ${session.accuracyPercent}% de precisão. A cada página, sua leitura fica mais fluida e confiante!`,
      de: `Was für eine tolle Lesestunde! Du hast so fleißig geübt und ${session.accuracyPercent}% Genauigkeit erreicht. Jeden Tag wirst du noch ein bisschen besser!`,
      it: `Che lettura fantastica! Hai dimostrato tanta passione raggiungendo il ${session.accuracyPercent}% di precisione. Continua così, sei un vero campione!`,
      nl: `Wat een prachtige leessessie! Je deed geweldig je best en behaalde ${session.accuracyPercent}% nauwkeurigheid. Elke dag wordt jouw leessupertalent groter!`,
      pl: `Co za wspaniałe czytanie! Pokazałeś wielką odwagę i osiągnąłeś ${session.accuracyPercent}% dokładności. Z każdym dniem czytasz coraz piękniej!`,
      tr: `Harika bir okuma oldu! Çok cesurca okudun ve %${session.accuracyPercent} doğruluk oranına ulaştın. Her gün çalıştıkça okuma süper gücün daha da artıyor!`,
    };
    return fallbacks[lang] || fallbacks.en;
  }
}

/**
 * Generate 2-3 interactive comprehension questions about what the child just read using Muse Spark.
 */
export async function generateComprehensionQuiz(
  pageText: string,
  language: SupportedLanguage = 'en'
): Promise<ComprehensionQuestion[]> {
  const systemPromptMap: Record<SupportedLanguage, string> = {
    en: `You are "Sparky", a Meta Muse Spark educational reading tutor. Create 2 fun, simple reading comprehension questions based ONLY on what the child just read.
Respond STRICTLY with a valid JSON array:
[
  {
    "id": "q1",
    "question": "Clear and engaging question?",
    "options": ["Option A", "Option B", "Option C"],
    "correctIndex": 0,
    "explanation": "Short cheerful explanation why this answer is right"
  }
]`,
    es: `Eres "Sparky", un tutor pedagógico de Meta Muse Spark. Crea 2 preguntas divertidas y sencillas de comprensión lectora basadas ÚNICAMENTE en el texto que leyó el niño.
Responde ESTRICTAMENTE con un arreglo JSON válido:
[
  {
    "id": "q1",
    "question": "¿Pregunta clara y entretenida?",
    "options": ["Opción A", "Opción B", "Opción C"],
    "correctIndex": 0,
    "explanation": "Explicación breve y alegre de por qué es la correcta"
  }
]`,
    fr: `Tu es "Sparky", tuteur pédagogique Meta Muse Spark. Crée 2 questions simples et amusantes basées UNIQUEMENT sur le texte lu par l'enfant.
Réponds STRICTEMENT avec un tableau JSON valide :
[
  {
    "id": "q1",
    "question": "Question claire et amusante ?",
    "options": ["Option A", "Option B", "Option C"],
    "correctIndex": 0,
    "explanation": "Courte explication chaleureuse"
  }
]`,
    pt: `Você é "Sparky", tutor pedagógico da Meta Muse Spark. Crie 2 perguntas simples e divertidas baseadas APENAS no texto que a criança acabou de ler.
Responda ESTRITAMENTE com um array JSON válido:
[
  {
    "id": "q1",
    "question": "Pergunta clara e divertida?",
    "options": ["Opção A", "Opção B", "Opção C"],
    "correctIndex": 0,
    "explanation": "Breve explicação calorosa"
  }
]`,
    de: `Du bist "Sparky", pädagogischer Lesetutor von Meta Muse Spark. Erstelle 2 kindgerechte Verständnisfragen basierend NUR auf dem gelesenen Text.
Antworte STRIKT mit einem gültigen JSON-Array:
[
  {
    "id": "q1",
    "question": "Klare und kindgerechte Frage?",
    "options": ["Option A", "Option B", "Option C"],
    "correctIndex": 0,
    "explanation": "Kurze fröhliche Erklärung, warum diese Antwort richtig ist"
  }
]`,
    it: `Sei "Sparky", tutor pedagogico di Meta Muse Spark. Crea 2 domande semplici di comprensione basate ESCLUSIVAMENTE sul testo appena letto.
Rispondi RIGOROSAMENTE con un array JSON valido:
[
  {
    "id": "q1",
    "question": "Domanda chiara e coinvolgente?",
    "options": ["Opzione A", "Opzione B", "Opzione C"],
    "correctIndex": 0,
    "explanation": "Breve spiegazione calorosa del perché è esatta"
  }
]`,
    nl: `Je bent "Sparky", educatieve leestutor van Meta Muse Spark. Bedenk 2 leuke begripsvragen die ALLEEN gebaseerd zijn op de zojuist gelezen tekst.
Antwoord STRIKT met een geldige JSON-array:
[
  {
    "id": "q1",
    "question": "Duidelijke en leuke vraag?",
    "options": ["Optie A", "Optie B", "Optie C"],
    "correctIndex": 0,
    "explanation": "Korte bemoedigende uitleg waarom dit klopt"
  }
]`,
    pl: `Jesteś "Sparky", pedagogicznym korepetytorem czytania Meta Muse Spark. Utwórz 2 proste pytania ze zrozumienia tekstu oparte WYŁĄCZNIE na przeczytanej stronie.
Odpowiedz ŚCIŚLE w formacie tablicy JSON:
[
  {
    "id": "q1",
    "question": "Jasne i angażujące pytanie?",
    "options": ["Opcja A", "Opcja B", "Opcja C"],
    "correctIndex": 0,
    "explanation": "Krótkie radosne wyjaśnienie, dlaczego to poprawna odpowiedź"
  }
]`,
    tr: `Sen Meta Muse Spark eğitici okuma koçu "Sparky"sin. Çocuğun az önce okuduğu metne dayanarak 2 eğlenceli ve anlaşılır anlama sorusu oluştur.
KESİNLİKLE geçerli bir JSON dizisi ile yanıt ver:
[
  {
    "id": "q1",
    "question": "Net ve sevimli soru?",
    "options": ["Seçenek A", "Seçenek B", "Seçenek C"],
    "correctIndex": 0,
    "explanation": "Bu cevabın neden doğru olduğuna dair neşeli kısa açıklama"
  }
]`,
  };

  const systemPrompt = systemPromptMap[language] || systemPromptMap.en;
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
  // Child audio only leaves the device when a parent has allowed it in the Privacy Shield
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
 * Answer a child's curious voice question about the story using Muse Spark.
 */
export async function answerChildVoiceQuestionWithSparky(
  question: string,
  storyContext: string,
  language: SupportedLanguage = 'en'
): Promise<string> {
  const systemPromptMap: Record<SupportedLanguage, string> = {
    en: `You are "Sparky", a warm, playful, and patient Meta Muse Spark AI reading tutor for children aged 6 to 10.
A child just asked you a question with their own voice about the story they are reading.
Answer in 2-3 enthusiastic, clear, and age-appropriate sentences. Encourage their curiosity!`,
    es: `Eres "Sparky", el tutor de lectura paciente, cariñoso y divertido de Meta Muse Spark para niños de 6 a 10 años.
Un niño te acaba de hacer una pregunta con su propia voz sobre el cuento que está leyendo.
Respóndele en 2 o 3 oraciones muy claras, entusiastas, con ternura y adaptadas a su edad. ¡Felicita su curiosidad!`,
    fr: `Tu es "Sparky", le tuteur de lecture bienveillant et joyeux de Meta Muse Spark pour enfants de 6 à 10 ans.
Un enfant vient de te poser une question avec sa voix sur l'histoire.
Réponds en 2-3 phrases simples, chaleureuses et enthousiastes. Félicite sa curiosité !`,
    pt: `Você é "Sparky", o tutor de leitura carinhoso e alegre da Meta Muse Spark para crianças de 6 a 10 anos.
Uma criança acabou de fazer uma pergunta com a voz dela sobre a história.
Responda em 2 a 3 frases claras, calorosas e fáceis de entender. Elogie a curiosidade dela!`,
    de: `Du bist "Sparky", der herzliche und spielerische KI-Lesetutor von Meta Muse Spark für Kinder von 6 bis 10 Jahren.
Ein Kind hat dir gerade mit seiner Stimme eine Frage zur Geschichte gestellt.
Antworte in 2-3 einfachen, fröhlichen und kindgerechten Sätzen. Lobe seine Neugier!`,
    it: `Sei "Sparky", il tutor di lettura affettuoso e giocoso di Meta Muse Spark per bambini di 6-10 anni.
Un bambino ti ha appena fatto una domanda a voce sulla storia.
Rispondi in 2-3 frasi semplici, incoraggianti e adatte alla sua età. Premia la sua curiosità!`,
    nl: `Je bent "Sparky", de lieve en vrolijke AI-leestutor van Meta Muse Spark voor kinderen van 6 tot 10 jaar.
Een kind heeft zojuist met eigen stem een vraag gesteld over het verhaal.
Antwoord in 2-3 eenvoudige, warme en enthousiaste zinnen. Prijs de nieuwsgierigheid!`,
    pl: `Jesteś "Sparky", ciepłym i radosnym korepetytorem czytania Meta Muse Spark dla dzieci w wieku 6-10 lat.
Dziecko zadało ci właśnie głosowo pytanie o czytaną bajkę.
Odpowiedz w 2-3 prostych, pogodnych zdaniach dopasowanych do dziecka. Pochwal jego ciekawość!`,
    tr: `Sen 6-10 yaş arası çocuklar için sevecen ve neşeli Meta Muse Spark okuma eğitmeni "Sparky"sin.
Bir çocuk okuduğu masal hakkında sana kendi sesiyle bir soru sordu.
Çocuğun anlayacağı 2-3 tatlı, net ve cesaretlendirici cümleyle yanıt ver. Merakını kutla!`,
  };

  const systemPrompt = systemPromptMap[language] || systemPromptMap.en;
  const userPrompt = `Story context: "${storyContext}"\nChild's voice question: "${question}"`;

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
      en: `That's a wonderful question! In our story, every page holds secrets to explore. Keep reading to see what happens next!`,
      es: `¡Qué gran pregunta! En esta historia cada página tiene sorpresas mágicas. ¡Sigamos leyendo para descubrir más juntos!`,
      fr: `Quelle belle question ! Dans cette histoire, chaque page réserve des surprises. Continuons à lire pour tout découvrir !`,
      pt: `Que pergunta fantástica! Nessa história cada página guarda surpresas mágicas. Vamos continuar lendo juntos!`,
      de: `Was für eine tolle Frage! In dieser Geschichte hält jede Seite neue Geheimnisse bereit. Lass uns weiterlesen!`,
      it: `Che bella domanda! In questa storia ogni pagina racchiude segreti magici. Continuiamo a leggere insieme!`,
      nl: `Wat een prachtige vraag! In dit verhaal heeft elke bladzijde leuke verrassingen. Laten we snel verder lezen!`,
      pl: `Wspaniałe pytanie! W tej opowieści każda strona kryje niezwykłe niespodzianki. Czytajmy dalej, by odkryć więcej!`,
      tr: `Ne harika bir soru! Bu masalda her sayfa sihirli sürprizlerle dolu. Neler olacağını görmek için okumaya devam edelim!`,
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
      curioso: { meaning: 'Tener muchas ganas de aprender, explorar y descubrir secretos.', example: 'El niño curioso siempre hace preguntas divertidas.', syl: 'cu-rio-so' },
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
    simpleMeaning: `A wonderful word that helps make the story exciting and colorful!`,
    funExample: `You can use "${word}" when telling your friends about this adventure.`,
    syllables: word.split('').join('-'),
    encouragement: 'Keep shining, you are doing fantastic!',
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
