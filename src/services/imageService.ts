import { ImageSourcePropType } from 'react-native';
import { ImageRef, SupportedLanguage } from '../types';

/**
 * Image & Illustration Service for Sparky AI Reading Tutor.
 *
 * Only bundled or curated images are used: no on-the-fly generation,
 * so a picture never fails with a rate-limit placeholder.
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
 * Returns a verified picture for a vocabulary word, or null when none is curated.
 * Words without a curated picture show no image rather than a guessed one.
 */
export function getWordIllustration(word: string): ImageRef | null {
  return CURATED_WORD_ILLUSTRATIONS[cleanWord(word)] ?? null;
}

/**
 * Converts an ImageRef into an <Image> source (bundled assets are passed through as-is).
 */
export function toImageSource(ref?: ImageRef): ImageSourcePropType {
  return typeof ref === 'string' || ref === undefined ? { uri: ref } : ref;
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
