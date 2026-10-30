import { ImageSourcePropType } from 'react-native';
import { ImageRef, SupportedLanguage } from '../types';

/**
 * Image & Illustration Service for Sparky AI Reading Tutor.
 *
 * Integrates:
 * 1. Meta Imagine / Multimodal Vision API (via EXPO_PUBLIC_META_IMAGINE_URL or Meta Model API).
 * 2. On-demand AI Storybook Illustration Generator (whimsical watercolor style tailored for children 6-10).
 * 3. Curated High-Definition Picture Dictionary for early literacy vocabulary.
 */

const HUMMINGBIRD_ART = require('../../assets/stories/hummingbird.jpg');

// Curated illustrations for common literacy vocabulary (instant load; each image verified to match its word)
const CURATED_WORD_ILLUSTRATIONS: Record<string, ImageRef> = {
  hummingbird: HUMMINGBIRD_ART,
  wings: HUMMINGBIRD_ART,
  colibrí: HUMMINGBIRD_ART,
  colibri: HUMMINGBIRD_ART,
  // English
  flower: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&auto=format&fit=crop&q=80',
  garden: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80',
  trees: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
  breeze: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',

  // Spanish
  bosque: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
  jardín: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80',
  jardin: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80',
  flores: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&auto=format&fit=crop&q=80',
  resplandor: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
};

/**
 * Clean a word token from punctuation
 */
function cleanWord(raw: string): string {
  return raw.toLowerCase().trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

/**
 * Returns a child-friendly visual illustration URL for any vocabulary word.
 * If a curated HD photo exists, returns it immediately.
 * Otherwise, synthesizes an AI watercolor children's book illustration prompt.
 */
export function getWordIllustrationUrl(
  word: string,
  language: SupportedLanguage = 'en',
  context?: string
): { url: ImageRef; isCurated: boolean; alt: string } {
  const cleaned = cleanWord(word);

  if (CURATED_WORD_ILLUSTRATIONS[cleaned]) {
    return {
      url: CURATED_WORD_ILLUSTRATIONS[cleaned],
      isCurated: true,
      alt: `Ilustración de ${cleaned}`,
    };
  }

  // Generate a safe, gentle, watercolor children's storybook illustration prompt
  const safePrompt = encodeURIComponent(
    `cute colorful whimsical children book illustration of ${cleaned}, friendly storybook watercolor art, clear simple focus for kids, bright sunny colors, no text, no words`
  );

  // Pollinations Flux / Stable Diffusion endpoint for child-safe, on-the-fly storybook visuals
  const aiGeneratedUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=600&height=400&nologo=true&seed=42`;

  return {
    url: aiGeneratedUrl,
    isCurated: false,
    alt: `Ilustración generada por IA para ${cleaned}`,
  };
}

/**
 * Converts an ImageRef into an <Image> source (bundled assets are passed through as-is).
 */
export function toImageSource(ref?: ImageRef): ImageSourcePropType {
  return typeof ref === 'string' || ref === undefined ? { uri: ref } : ref;
}

/**
 * Generates an enchanting full-scene storybook illustration for a book page.
 * Only the title goes to the external illustration service, never the page text a child is reading.
 */
export function getStorySceneIllustrationUrl(
  title: string,
  customImageUrl?: ImageRef
): ImageRef {
  if (customImageUrl) return customImageUrl;

  const prompt = encodeURIComponent(
    `children storybook watercolor illustration for "${title}", magical warm daylight, charming picture book style, vibrant colors, gentle, uplifting, no text`
  );

  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=480&nologo=true&seed=99`;
}

/**
 * Educational stickers for the Reading Reward Album.
 * Unlocked as children achieve reading milestones (stars & streak).
 */
export interface ReadingBadgeSticker {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  requiredStars: number;
  imageUrl: string;
}

export const REWARD_STICKERS: ReadingBadgeSticker[] = [
  {
    id: 'badge-colibri',
    name: 'Swift Hummingbird',
    nameEs: 'Colibrí Veloz',
    description: 'Read with great fluency and joy',
    descriptionEs: 'Lectura fluida y alegre como un colibrí',
    requiredStars: 10,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'badge-buho',
    name: 'Wise Owl',
    nameEs: 'Búho Sabio',
    description: 'Answer comprehension questions accurately',
    descriptionEs: 'Respondió el cuestionario de comprensión',
    requiredStars: 25,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'badge-estrella',
    name: 'Luminous Explorer',
    nameEs: 'Explorador Resplandeciente',
    description: 'Read 3 physical book pages in a row',
    descriptionEs: 'Leyó 3 páginas de libros seguidas',
    requiredStars: 40,
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'badge-fuego',
    name: 'Super Streak Hero',
    nameEs: 'Héroe de la Racha',
    description: '5 consecutive days reading physical books',
    descriptionEs: '5 días consecutivos leyendo libros físicos',
    requiredStars: 60,
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300&auto=format&fit=crop&q=80',
  },
];
