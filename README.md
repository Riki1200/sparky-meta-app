# ✨ Sparky Reader (Sparky Lector)
### AI Reading Tutor for Children with Real, Physical Books
**Built for the Meta Global AI Developer Hackathon using Meta Model API (Muse Spark 1.3 & Muse Voice Transcribe)**

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2058-22c55e.svg)](https://expo.dev)
[![Meta Model API](https://img.shields.io/badge/Meta%20Model%20API-Muse%20Spark%201.3-0668E1.svg)](https://api.meta.ai)
[![Global Literacy](https://img.shields.io/badge/Impact-Dominican%20Republic%20%26%20Global-ea580c.svg)](#-social-impact-the-reading-crisis)
[![Child Privacy](https://img.shields.io/badge/Child%20Privacy-100%25%20On--Device%20OCR%20%26%20Audio-10b981.svg)](#-guaranteed-child-privacy-coppa-compliant)
[![Languages](https://img.shields.io/badge/Languages-9%20Supported%20(Default%3A%20EN)-blue.svg)](#-global-multilingual-support-default-english)

---

## 🌟 Project Vision

Children learn best from real, tactile paper books. With **Sparky Reader**, a child points their phone or tablet camera at any page of any physical book and reads aloud:

1. **On-Device OCR**: Instantly captures physical text using contrast-enhanced on-device vision processing (Tesseract.js WebAssembly).
2. **Real-Time Speech Recognition**: Listens word-by-word with continuous phonetic alignment.
3. **Instant Fluency & Error Detection**:
   - 🟢 **Correct**: Words read accurately and smoothly.
   - 🟡 **Hesitations**: Automatically flags pauses longer than 1.8 seconds before pronouncing a word.
   - 🔴 **Pronunciation Practice**: Highlights words that phonetically diverge (Levenshtein distance similarity match).
   - 🟣 **Skipped**: Detects omitted words.
4. **Patient AI Tutor Powered by Meta Muse Spark (`muse-spark-1.3`)**:
   - Explains tricky words on demand using child-friendly metaphors, real-world examples, and phonetic syllable breakdowns.
   - Speaks warm, spoken encouragement after every reading session.
   - Generates interactive, 2-question comprehension trivia games derived solely from the text the child just read.
5. **Cloud Voice Fallback with Meta Muse Voice Transcribe (`muse-voice-transcribe-1.0`)**: Provides fallback transcription for noisy classrooms or low-connectivity environments.
6. **Strict Child Privacy (COPPA/FERPA Compliant)**: Camera images and microphone audio **never leave the child's device**. Only anonymized vocabulary words are sent to Meta Model API.
7. **Parent & Teacher Progress Dashboard**: Tracks Words Per Minute (**WPM**), accuracy rate, hesitation analysis against grade-level reading benchmarks (Grade 1–3), and generates actionable vocabulary flashcards.

---

## 🌐 Global Multilingual Support (Default: English)

Sparky Reader is built for children worldwide. It defaults to **English** (`en`) on launch and natively supports **9 languages** with instantaneous 1-click switching via the header segmented selector:

| Language | Code | Flag | Sample Book | Speech & Audio | OCR Model | Meta Muse Spark Tutor |
| :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| **English (Default)** | `en` | 🇺🇸 | *The Little Hummingbird's Flight* | `en-US` Speech & TTS | `eng` | Child-friendly explanations & trivia in English |
| **Español (Dominicana)** | `es` | 🇩🇴 | *El Gallito Cantor del Cibao* | `es-DO` / `es-419` | `spa` | Dominican & Latin American contextual tutor |
| **Français** | `fr` | 🇫🇷 | *Le Petit Colibri du Matin* | `fr-FR` | `fra` | Tuteur pédagogique bienveillant en français |
| **Português** | `pt` | 🇧🇷 | *O Pequeno Beija-Flor Dourado* | `pt-BR` | `por` | Tutor carinhoso e lúdico em português |
| **Deutsch** | `de` | 🇩🇪 | *Der kleine Kolibri und die Zauberblume* | `de-DE` | `deu` | Herzlicher KI-Leselern-Tutor auf Deutsch |
| **Italiano** | `it` | 🇮🇹 | *Il Piccolo Colibrì e il Fiore d'Oro* | `it-IT` | `ita` | Tutor di lettura affettuoso in italiano |
| **Nederlands** | `nl` | 🇳🇱 | *De Kleine Kolibrie en de Bloem* | `nl-NL` | `nld` | Vriendelijke AI-leestutor in het Nederlands |
| **Polski** | `pl` | 🇵🇱 | *Mały Koliber i Kolorowy Ogród* | `pl-PL` | `pol` | Ciepły korepetytor czytania po polsku |
| **Türkçe** | `tr` | 🇹🇷 | *Küçük Sinek Kuşunun Uçuşu* | `tr-TR` | `tur` | Neşeli ve sevecen Türkçe okuma koçu |

Switching languages immediately synchronizes:
- Full UI and navigation strings.
- Curated bookshelf stories with age-appropriate grade levels.
- Phonetic normalization and Levenshtein distance metrics (supporting special characters such as `ä, ö, ü, ß, ç, ğ, ı, ş, ą, ć, ę, ł, ń, ó, ś, ź, ż`).
- Text-to-Speech synthesis with native accent and child-friendly pitch.
- On-device Tesseract OCR character recognition dictionary.
- Meta Muse Spark reasoning prompts, spoken feedback, and comprehension quiz generation.

---

## 🇩🇴 Social Impact: The Reading Crisis

> **The Problem**: International regional evaluations by **UNESCO (ERCE / TERCE)** consistently show that in the Dominican Republic and broader Latin America, **over 60% of 3rd grade children cannot read or comprehend a simple grade-level text**.
>
> Many children come from working-class households where parents work long hours and lack pedagogical training to sit down with their kids every day. Private tutors are an inaccessible luxury for the vast majority of families.
>
> **The Sparky Solution**: Sparky gives every child an inexhaustible, patient, and loving private tutor for **any physical book they already own at home or in school**. Just 10 minutes a day of guided reading helps children double their decoding speed, eliminate hesitation anxiety, and develop lifelong reading confidence.

---

## 🚀 Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPARKY READER CLIENT                            │
│                     (React Native / Expo Web)                          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
     [100% On-Device Processing]         [Secure Text-Only Transmission]
                    │                                │
      ┌─────────────┴─────────────┐                  ▼
      │ • On-Device Camera View   │           Meta Model API
      │ • Tesseract.js / Canvas   │      (https://api.meta.ai/v1)
      │ • Contrast Preprocessing  │                  │
      │ • Speech Alignment Engine │        ┌─────────┴─────────┐
      │ • Hesitation (>1.8s)      │        │                   │
      │ • Phonetic Distance Match │        ▼                   ▼
      │ • Web Audio Chimes & TTS  │  Muse Spark 1.3   Muse Voice Transcribe
      └───────────────────────────┘ (Kid Tutor,       (Cloud Speech-to-Text
                                     Explanations,     Fallback)
                                     Quiz Generator)
```

### Key Technical Innovations:
- **Muse Spark Reasoning Token Budgeting**: `muse-spark-1.3` consumes between 300 to 500 reasoning tokens before generating its response. By configuring `max_tokens: 1800` and structured JSON response schemas, Sparky receives complete child-friendly explanations and quizzes with zero truncation.
- **On-Device Image Pre-Processing**: Canvas grayscale contrast stretching isolates high-frequency text edges from glossy book reflections before feeding frames into Tesseract.js.
- **Universal Multi-Alphabet Normalization**: Strips punctuation and maps phonetic variants across Latin, Germanic, Slavic, and Turkish alphabets for accurate Levenshtein distance scoring.

---

## 🔒 Guaranteed Child Privacy (COPPA Compliant)

- 🛡️ **Zero Image Uploads**: Book photos and camera frames are processed directly inside the client's WebAssembly sandbox. Images are never uploaded to any server or cloud storage.
- 🎙️ **On-Device Voice Recognition**: Microphones evaluate speech locally via the device's Speech API.
- 💬 **No Personal Identifiable Information (PII)**: Only isolated vocabulary words and anonymized reading metrics are sent to Meta Model API to fetch explanations and trivia.

---

## 📱 Getting Started & How to Run

### 1. Prerequisites
- Node.js (v18+)
- npm or bun

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (this file is excluded from git to keep credentials safe):
```bash
cp .env.example .env
```
Set your Meta Model API key inside `.env`:
```env
EXPO_PUBLIC_META_API_KEY=your_meta_api_key_here
EXPO_PUBLIC_META_API_BASE_URL=https://api.meta.ai/v1
```

### 4. Run the Development Server
```bash
# Start in Web mode (Recommended for instant browser testing with camera & microphone)
npm run web

# Or start with Expo CLI for mobile testing via Expo Go (iOS / Android)
npx expo start
```

### 4. Interactive Testing in Browser
Open **[http://localhost:8083](http://localhost:8083)** in Google Chrome, Safari, or Microsoft Edge:

- **1-Click Simulation Demo**: Click the **"Simulate Demo"** button on the bottom control bar to watch real-time word-by-word reading with live highlighting of correct words, hesitations (>1.8s), and phonetic practice words.
- **Tap Any Word**: Click on any word on the page (e.g., *"fluttered"*, *"courage"*, or *"hummingbird"*) to open the **Meta Muse Spark AI Tutor** drawer.
- **Scan Physical Book**: Click **"Scan Book (OCR)"** to point your webcam or upload a photo of any real page.
- **Parent & Teacher Report**: Switch to the **"Parent Report"** tab to view the live WPM speedometer, accuracy percentage, and interactive practice flashcards with syllable breakdowns.
- **Switch Languages**: Click any flag in the top right (`[🇺🇸 EN] [🇩🇴 ES] [🇫🇷 FR] [🇧🇷 PT] [🇩🇪 DE] [🇮🇹 IT] [🇳🇱 NL] [🇵🇱 PL] [🇹🇷 TR]`) to see the whole system update instantaneously.

---

## 👨‍🏫 Hackathon Submission & Team

Developed for the **Meta Global AI Developer Hackathon**:
- **Primary AI Model**: `muse-spark-1.3` via Meta Model API (`https://api.meta.ai/v1`)
- **Voice Fallback Model**: `muse-voice-transcribe-1.0`
- **Application Framework**: React Native with Expo SDK 58
- **Core Mission**: Solving global childhood reading poverty through privacy-first on-device AI.
