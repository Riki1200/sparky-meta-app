# ✨ Sparky Reader (Sparky Lector)
### AI Reading Coach for Adults, with Real Printed Pages
**Built for the Meta Global AI Developer Hackathon using Meta Model API (Muse Spark 1.3 & Muse Voice Transcribe)**

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2058-22c55e.svg)](https://expo.dev)
[![Meta Model API](https://img.shields.io/badge/Meta%20Model%20API-Muse%20Spark%201.3-0668E1.svg)](https://api.meta.ai)
[![Adults 18+](https://img.shields.io/badge/Audience-Adults%2018%2B-ea580c.svg)](#-who-it-is-for)
[![Privacy](https://img.shields.io/badge/Privacy-Cloud%20features%20off%20by%20default-10b981.svg)](#-privacy-by-design)
[![Languages](https://img.shields.io/badge/Languages-9%20Supported%20(Default%3A%20EN)-blue.svg)](#-global-multilingual-support-default-english)

---

## 🙋 Who it is for

Sparky is for **adults (18+)**: people who never learned to read fluently, and people reading in a new language (for example, parents who want to read in the language their children learn at school). The app asks every user to confirm they are 18 or older before they start; the Meta Model API is used only by adults.

Practicing reading as an adult is often done alone and in private. Sparky lets you practice with **any printed page you already have**: a book, a letter, a notice, a recipe.

## 🌟 How it works

1. **Page Capture**: On-device OCR (Tesseract.js WebAssembly) by default. If you allow it, **Meta Muse Spark vision** reads the page photo instead; on-device OCR remains the fallback.
2. **Real-Time Speech Recognition**: Listens word-by-word with continuous phonetic alignment.
3. **Instant Fluency & Error Detection**:
   - 🟢 **Correct**: Words read accurately and smoothly.
   - 🟡 **Hesitations**: Flags pauses longer than 1.8 seconds before a word.
   - 🔴 **Pronunciation Practice**: Highlights words that phonetically diverge (Levenshtein similarity).
   - 🟣 **Skipped**: Detects omitted words.
4. **Patient AI Coach Powered by Meta Muse Spark (`muse-spark-1.3`)**:
   - Explains difficult words in plain language, with everyday adult examples and syllable breakdowns.
   - Gives short spoken feedback after every reading session.
   - Generates 2-question comprehension checks from the text you just read.
   - Answers spoken questions about the text.
5. **Meta-Verified Reading Score with Meta Muse Voice Transcribe (`muse-voice-transcribe-1.0`)**: If you allow it, the session audio is transcribed by Muse Voice and **re-scored** against the page text with a word-level alignment (tolerant to repeats and self-corrections), shown next to the live device score.
6. **Privacy by design**: Both Meta cloud features above are **off by default** and switched on by the reader in the Privacy Shield.
7. **My Progress**: Words Per Minute (**WPM**), accuracy, hesitations and practice words, plus a printable practice sheet.

---

## 🌐 Global Multilingual Support (Default: English)

Sparky defaults to **English** (`en`) and supports **9 languages**, switched from the header menu:

| Language | Code | Sample text | Speech & Audio | OCR Model |
| :--- | :---: | :--- | :--- | :---: |
| **English (Default)** | `en` | *The Little Hummingbird's Flight* | `en-US` | `eng` |
| **Español** | `es` | *El Gallito Cantor del Cibao* | `es-DO` / `es-419` | `spa` |
| **Français** | `fr` | *Le Petit Colibri du Matin* | `fr-FR` | `fra` |
| **Português** | `pt` | *O Pequeno Beija-Flor Dourado* | `pt-BR` | `por` |
| **Deutsch** | `de` | *Der kleine Kolibri und die Zauberblume* | `de-DE` | `deu` |
| **Italiano** | `it` | *Il Piccolo Colibrì e il Fiore d'Oro* | `it-IT` | `ita` |
| **Nederlands** | `nl` | *De Kleine Kolibrie en de Bloem* | `nl-NL` | `nld` |
| **Polski** | `pl` | *Mały Koliber i Kolorowy Ogród* | `pl-PL` | `pol` |
| **Türkçe** | `tr` | *Küçük Sinek Kuşunun Uçuşu* | `tr-TR` | `tur` |

Switching languages updates the interface, sample texts, speech recognition, text-to-speech, OCR dictionary, and the language Muse Spark answers in (one shared adult-learner prompt, answered in the selected language).

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
      └───────────────────────────┘ (Reading Coach,   (Cloud Speech-to-Text
                                     Explanations,     Fallback)
                                     Quiz Generator)
```

### Key Technical Innovations:
- **Muse Spark Reasoning Token Budgeting**: `muse-spark-1.3` consumes between 300 to 500 reasoning tokens before generating its response. By configuring `max_tokens: 1800` and structured JSON response schemas, Sparky receives complete explanations and quizzes with zero truncation.
- **On-Device Image Pre-Processing**: Canvas grayscale contrast stretching isolates high-frequency text edges from glossy book reflections before feeding frames into Tesseract.js.
- **Universal Multi-Alphabet Normalization**: Strips punctuation and maps phonetic variants across Latin, Germanic, Slavic, and Turkish alphabets for accurate Levenshtein distance scoring.

---

## 🔒 Privacy by design

What leaves the device, exactly:

- 🛡️ **Page photos: never by default.** OCR runs inside the app (Tesseract.js / WebAssembly). A photo is sent to Meta Muse Spark only if you turn on *page reading* in the Privacy Shield; Sparky never stores it.
- 🎙️ **Live reading audio: handled by the platform speech service.** Word-by-word recognition uses the device/browser Web Speech API (in some browsers, e.g. Chrome, the browser vendor processes it). Sparky never stores recordings.
- ☁️ **Meta Muse Voice: only if you allow it.** Off by default. When on, a session's audio (or a spoken question) is sent to `muse-voice-transcribe-1.0` to double-check the reading. When off, *Ask Sparky* uses the device speech service instead.
- 💬 **Meta Muse Spark: text by default.** The page text, single words and anonymous scores, to create explanations, quizzes and feedback. No names or audio. Page photos only if you turn on *page reading*.
- 🖼️ **Picture dictionary:** only bundled or curated photos; no images are generated on the fly and no word is sent to an image service.
- 🔑 **API key stays on the server**: in production a Firebase Function proxies Meta calls (`functions/index.js`); for local development use `server/meta-proxy.mjs`.

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

### 5. Publish (Firebase Hosting + Functions)
Phones only allow the microphone, camera and app install on HTTPS pages. Sparky deploys to Firebase project `sparky-lector`:
- **Hosting** serves the PWA at `https://sparky-lector.web.app`.
- **Cloud Functions** runs the Meta API proxy (`functions/index.js`), reached through the same domain at `/api/**`. The Meta key lives in Secret Manager, never in the app.

One-time setup (the project must be on the Blaze plan):
```bash
npm install -g firebase-tools
firebase login
cd functions && npm install && cd ..
firebase functions:secrets:set META_API_KEY   # paste the key when prompted
```
Deploy:
```bash
npm run deploy
```
`npm run deploy` builds the web app pointing at `/api` without any key, fails if a key leaked into `dist/` (`scripts/check-bundle.mjs`), then runs `firebase deploy`.

On the phone, open `https://sparky-lector.web.app` and install it: Chrome → *Install app*, or Safari → *Share → Add to Home Screen*. Sparky is a **PWA** (`public/manifest.json`, `public/sw.js`): it launches full-screen from its own icon and opens offline; the Meta tutor, page reading and verification need a connection. The service worker only registers on deployed builds, not on `localhost`.

### 6. What to try
- **Read**: tap the big microphone in the bottom bar and read the page aloud; words turn green, yellow (hesitation) or red (practice).
- **Demo** (under *More*): plays a simulated reading, useful when you cannot read aloud.
- **Tap any word** to open the Meta Muse Spark coach (meaning, syllables, example).
- **Scan**: the camera button in the header captures any printed page.
- **My Progress**: WPM, accuracy, practice words and, with Muse Voice on, the Meta-verified score.
- **Privacy Shield** (menu): turn on the two optional Meta cloud features.
- **Languages**: 9 languages from the menu; the interface, sample texts and coach switch instantly.

See [DEMO.md](DEMO.md) for a 3-minute pitch script.

---

## 👨‍🏫 Hackathon Submission & Team

Developed for the **Meta Global AI Developer Hackathon**:
- **Primary AI Model**: `muse-spark-1.3` via Meta Model API (`https://api.meta.ai/v1`)
- **Vision**: `muse-spark-1.3` reads photos of printed pages (optional, enabled by the reader)
- **Voice Model**: `muse-voice-transcribe-1.0` for the Meta-verified reading score (optional, enabled by the reader)
- **Application Framework**: React Native with Expo SDK 58
- **Audience**: adults (18+) learning to read or reading in a new language.
