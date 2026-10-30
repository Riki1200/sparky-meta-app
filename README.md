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

1. **Page Capture**: On-device OCR (Tesseract.js WebAssembly) by default. With a parent's permission, **Meta Muse Spark vision** reads the page photo instead; on-device OCR remains the fallback.
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
5. **Meta-Verified Reading Score with Meta Muse Voice Transcribe (`muse-voice-transcribe-1.0`)**: With a parent's permission, the session audio is transcribed by Muse Voice and **re-scored** against the page text with a word-level alignment (tolerant to repeats and self-corrections). Parents see the Meta-verified accuracy next to the live device score.
6. **Child Privacy by Design (COPPA principles)**: Both Meta cloud features above are **off by default** and switched on by a parent in the Privacy Shield. Without them, book photos and child audio never reach Meta.
7. **Parent & Teacher Progress Dashboard**: Tracks Words Per Minute (**WPM**), accuracy rate, hesitation analysis against oral reading fluency norms ([Hasbrouck & Tindal, 2017](https://www.readingrockets.org/article/fluency-norms-chart-2017-update); English norms, used as a reference), and generates actionable vocabulary flashcards.

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

> **The Problem**: Many children reach the end of primary school without being able to read and understand a simple text. Their parents often work long hours, and private tutors are out of reach for most families.
>
> Many children come from working-class households where parents work long hours and lack pedagogical training to sit down with their kids every day. Private tutors are an inaccessible luxury for the vast majority of families.
>
> **The Sparky Solution**: Sparky gives every child an inexhaustible, patient, and loving private tutor for **any physical book they already own at home or in school**. Short, regular guided reading practice is how fluency and reading confidence are built, and Sparky makes that practice available every day.

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

## 🔒 Child Privacy by Design (COPPA principles)

What leaves the device, exactly:

- 🛡️ **Book photos: never by default.** OCR runs inside the app (Tesseract.js / WebAssembly). A photo is sent to Meta Muse Spark only if a parent turns on *page reading* in the Privacy Shield; Sparky never stores it.
- 🎙️ **Live reading audio: handled by the platform speech service.** Word-by-word recognition uses the device/browser Web Speech API (in some browsers, e.g. Chrome, the browser vendor processes it). Sparky never stores recordings.
- ☁️ **Meta Muse Voice: only with parent permission.** Off by default. A parent can enable it in the Privacy Shield; then a session's audio (or a spoken question) is sent to `muse-voice-transcribe-1.0` to double-check the reading. Without permission, *Ask Sparky* uses the device speech service instead.
- 💬 **Meta Muse Spark: text by default.** The page text, single vocabulary words and anonymous scores, to create explanations, quizzes and feedback. No names or audio. Book page photos are sent only if a parent turns on *Meta Muse Spark page reading*.
- 🖼️ **Picture dictionary:** single vocabulary words (never page text) go to an external illustration service.
- 🔑 **API key stays on the server** when using the bundled proxy (`server/meta-proxy.mjs`).

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
Start the API proxy, which keeps your Meta key on the server (never inside the app bundle):
```bash
META_API_KEY=your_meta_api_key_here npm run proxy   # listens on http://localhost:8787
```
and point the app at it in `.env`:
```env
EXPO_PUBLIC_META_API_BASE_URL=http://localhost:8787
```
> For a quick local test you can still call Meta directly with `EXPO_PUBLIC_META_API_KEY`, but anything prefixed `EXPO_PUBLIC_` is visible to anyone who opens the app. In production, set `ALLOWED_ORIGIN` on the proxy to your app's URL.

### 4. Run the Development Server
```bash
npm run web
```
Sparky is a **mobile web app**: live reading uses the browser's Web Speech API and the camera/OCR pipeline runs in the browser. Use Chrome, Edge or Safari (Firefox has no Web Speech API). The native Expo Go build does not support live reading.

### 5. Run it on a phone (HTTPS)
Phones only allow the microphone and camera on HTTPS pages, so a LAN `http://` address will not work. Publish a preview build with EAS Hosting:
```bash
npx expo export --platform web
npx eas-cli@latest deploy
```
Open the preview URL on the phone and install it: Chrome → *Install app*, or Safari → *Share → Add to Home Screen*. Sparky is a **PWA** (`public/manifest.json`, `public/sw.js`): it launches full-screen from its own icon and opens offline; the Meta tutor, page reading and verification need a connection. The service worker only registers on deployed builds, not on `localhost`. The Meta API proxy must also be reachable over HTTPS (deploy `server/meta-proxy.mjs` to any Node host and point `EXPO_PUBLIC_META_API_BASE_URL` at it).

### 6. What to try
- **Read**: tap the big microphone in the bottom bar and read the page aloud; words turn green, yellow (hesitation) or red (practice).
- **Demo**: plays a simulated child reading, useful when you cannot read aloud.
- **Tap any word** to open the Meta Muse Spark tutor (meaning, syllables, picture).
- **Scan**: the camera button in the header captures a real book page.
- **Parent Report**: WPM, accuracy, practice words and, with Muse Voice on, the Meta-verified score.
- **Privacy Shield** (menu): turn on the two optional Meta cloud features.
- **Languages**: 9 languages from the menu; the whole app, stories and tutor switch instantly.

See [DEMO.md](DEMO.md) for a 3-minute pitch script.

---

## 👨‍🏫 Hackathon Submission & Team

Developed for the **Meta Global AI Developer Hackathon**:
- **Primary AI Model**: `muse-spark-1.3` via Meta Model API (`https://api.meta.ai/v1`)
- **Vision**: `muse-spark-1.3` reads photos of physical book pages (optional, parent-enabled)
- **Voice Model**: `muse-voice-transcribe-1.0` for the Meta-verified reading score (optional, parent-enabled)
- **Application Framework**: React Native with Expo SDK 58
- **Core Mission**: Solving global childhood reading poverty with privacy-first AI.
