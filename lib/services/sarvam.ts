/**
 * SARVAM AI SERVICE
 *
 * REST API client for Sarvam AI — India's leading foundational AI models.
 * Supports 30+ voices across 11 Indian languages:
 *   Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, English (Indian)
 *
 * Pipeline:
 * 1. Audio (Indic) → STT Translate → English Text
 * 2. LLM (Groq) processes English Text → English Text
 * 3. English Text → Sarvam Translate → Target Language Text
 * 4. Target Language Text → Sarvam TTS (Bulbul v1) → Audio
 */

const API_KEY = process.env.SARVAM_API_KEY || "";
const BASE_URL = "https://api.sarvam.ai";

const HEADERS = {
    "api-subscription-key": API_KEY,
};

// ─── VOICE CATALOGUE ──────────────────────────────────────────────
// 30+ Sarvam voices across 11 languages.
// Each entry maps to a Bulbul:v1 speaker + target language code.
export interface SarvamVoice {
    id: string;           // unique ID used throughout the app
    name: string;         // display name
    speaker: string;      // Sarvam API speaker param
    language: string;     // BCP-47 language code for TTS + translation
    languageLabel: string; // human-readable language name
    gender: "Male" | "Female";
}

export const SARVAM_VOICES: SarvamVoice[] = [
    // ── Hindi (hi-IN) ──────────────────────────────────
    { id: "meera-hi",    speaker: "meera",    language: "hi-IN", languageLabel: "Hindi",    name: "Meera (Hindi)",    gender: "Female" },
    { id: "pavithra-hi", speaker: "pavithra", language: "hi-IN", languageLabel: "Hindi",    name: "Pavithra (Hindi)", gender: "Female" },
    { id: "maitreyi-hi", speaker: "maitreyi", language: "hi-IN", languageLabel: "Hindi",    name: "Maitreyi (Hindi)", gender: "Female" },
    { id: "arvind-hi",   speaker: "arvind",   language: "hi-IN", languageLabel: "Hindi",    name: "Arvind (Hindi)",   gender: "Male"   },
    { id: "amol-hi",     speaker: "amol",     language: "hi-IN", languageLabel: "Hindi",    name: "Amol (Hindi)",     gender: "Male"   },
    { id: "amartya-hi",  speaker: "amartya",  language: "hi-IN", languageLabel: "Hindi",    name: "Amartya (Hindi)",  gender: "Male"   },

    // ── Bengali (bn-IN) ────────────────────────────────
    { id: "meera-bn",    speaker: "meera",    language: "bn-IN", languageLabel: "Bengali",  name: "Meera (Bengali)",    gender: "Female" },
    { id: "pavithra-bn", speaker: "pavithra", language: "bn-IN", languageLabel: "Bengali",  name: "Pavithra (Bengali)", gender: "Female" },
    { id: "amartya-bn",  speaker: "amartya",  language: "bn-IN", languageLabel: "Bengali",  name: "Amartya (Bengali)",  gender: "Male"   },
    { id: "arvind-bn",   speaker: "arvind",   language: "bn-IN", languageLabel: "Bengali",  name: "Arvind (Bengali)",   gender: "Male"   },

    // ── Gujarati (gu-IN) ───────────────────────────────
    { id: "meera-gu",    speaker: "meera",    language: "gu-IN", languageLabel: "Gujarati", name: "Meera (Gujarati)",    gender: "Female" },
    { id: "maitreyi-gu", speaker: "maitreyi", language: "gu-IN", languageLabel: "Gujarati", name: "Maitreyi (Gujarati)", gender: "Female" },
    { id: "amol-gu",     speaker: "amol",     language: "gu-IN", languageLabel: "Gujarati", name: "Amol (Gujarati)",     gender: "Male"   },

    // ── Kannada (kn-IN) ────────────────────────────────
    { id: "pavithra-kn", speaker: "pavithra", language: "kn-IN", languageLabel: "Kannada",  name: "Pavithra (Kannada)", gender: "Female" },
    { id: "maitreyi-kn", speaker: "maitreyi", language: "kn-IN", languageLabel: "Kannada",  name: "Maitreyi (Kannada)", gender: "Female" },
    { id: "arvind-kn",   speaker: "arvind",   language: "kn-IN", languageLabel: "Kannada",  name: "Arvind (Kannada)",   gender: "Male"   },
    { id: "amol-kn",     speaker: "amol",     language: "kn-IN", languageLabel: "Kannada",  name: "Amol (Kannada)",     gender: "Male"   },

    // ── Malayalam (ml-IN) ──────────────────────────────
    { id: "meera-ml",    speaker: "meera",    language: "ml-IN", languageLabel: "Malayalam", name: "Meera (Malayalam)",    gender: "Female" },
    { id: "pavithra-ml", speaker: "pavithra", language: "ml-IN", languageLabel: "Malayalam", name: "Pavithra (Malayalam)", gender: "Female" },
    { id: "amartya-ml",  speaker: "amartya",  language: "ml-IN", languageLabel: "Malayalam", name: "Amartya (Malayalam)",  gender: "Male"   },

    // ── Marathi (mr-IN) ────────────────────────────────
    { id: "maitreyi-mr", speaker: "maitreyi", language: "mr-IN", languageLabel: "Marathi",  name: "Maitreyi (Marathi)", gender: "Female" },
    { id: "meera-mr",    speaker: "meera",    language: "mr-IN", languageLabel: "Marathi",  name: "Meera (Marathi)",    gender: "Female" },
    { id: "amol-mr",     speaker: "amol",     language: "mr-IN", languageLabel: "Marathi",  name: "Amol (Marathi)",     gender: "Male"   },
    { id: "arvind-mr",   speaker: "arvind",   language: "mr-IN", languageLabel: "Marathi",  name: "Arvind (Marathi)",   gender: "Male"   },

    // ── Odia (od-IN) ───────────────────────────────────
    { id: "meera-od",    speaker: "meera",    language: "od-IN", languageLabel: "Odia",     name: "Meera (Odia)",    gender: "Female" },
    { id: "amartya-od",  speaker: "amartya",  language: "od-IN", languageLabel: "Odia",     name: "Amartya (Odia)",  gender: "Male"   },

    // ── Punjabi (pa-IN) ────────────────────────────────
    { id: "meera-pa",    speaker: "meera",    language: "pa-IN", languageLabel: "Punjabi",  name: "Meera (Punjabi)",    gender: "Female" },
    { id: "pavithra-pa", speaker: "pavithra", language: "pa-IN", languageLabel: "Punjabi",  name: "Pavithra (Punjabi)", gender: "Female" },
    { id: "amol-pa",     speaker: "amol",     language: "pa-IN", languageLabel: "Punjabi",  name: "Amol (Punjabi)",     gender: "Male"   },

    // ── Tamil (ta-IN) ──────────────────────────────────
    { id: "meera-ta",    speaker: "meera",    language: "ta-IN", languageLabel: "Tamil",    name: "Meera (Tamil)",    gender: "Female" },
    { id: "maitreyi-ta", speaker: "maitreyi", language: "ta-IN", languageLabel: "Tamil",    name: "Maitreyi (Tamil)", gender: "Female" },
    { id: "arvind-ta",   speaker: "arvind",   language: "ta-IN", languageLabel: "Tamil",    name: "Arvind (Tamil)",   gender: "Male"   },
    { id: "amol-ta",     speaker: "amol",     language: "ta-IN", languageLabel: "Tamil",    name: "Amol (Tamil)",     gender: "Male"   },

    // ── Telugu (te-IN) ─────────────────────────────────
    { id: "meera-te",    speaker: "meera",    language: "te-IN", languageLabel: "Telugu",   name: "Meera (Telugu)",    gender: "Female" },
    { id: "pavithra-te", speaker: "pavithra", language: "te-IN", languageLabel: "Telugu",   name: "Pavithra (Telugu)", gender: "Female" },
    { id: "arvind-te",   speaker: "arvind",   language: "te-IN", languageLabel: "Telugu",   name: "Arvind (Telugu)",   gender: "Male"   },
    { id: "amartya-te",  speaker: "amartya",  language: "te-IN", languageLabel: "Telugu",   name: "Amartya (Telugu)",  gender: "Male"   },

    // ── English / Indian English (en-IN) ───────────────
    // Sarvam supports Indian-accented English through bulbul:v1
    { id: "meera-en",    speaker: "meera",    language: "en-IN", languageLabel: "English",  name: "Meera (English)",    gender: "Female" },
    { id: "pavithra-en", speaker: "pavithra", language: "en-IN", languageLabel: "English",  name: "Pavithra (English)", gender: "Female" },
    { id: "maitreyi-en", speaker: "maitreyi", language: "en-IN", languageLabel: "English",  name: "Maitreyi (English)", gender: "Female" },
    { id: "arvind-en",   speaker: "arvind",   language: "en-IN", languageLabel: "English",  name: "Arvind (English)",   gender: "Male"   },
    { id: "amol-en",     speaker: "amol",     language: "en-IN", languageLabel: "English",  name: "Amol (English)",     gender: "Male"   },
    { id: "amartya-en",  speaker: "amartya",  language: "en-IN", languageLabel: "English",  name: "Amartya (English)",  gender: "Male"   },
];

/**
 * Look up a voice by its ID. Returns the default (meera-hi) if not found.
 */
export function getVoiceById(voiceId: string): SarvamVoice {
    return SARVAM_VOICES.find(v => v.id === voiceId) || SARVAM_VOICES[0];
}

/**
 * Return the full voice catalogue for UI dropdowns.
 */
export function getSarvamVoices() {
    return SARVAM_VOICES.map(v => ({
        Name: v.name,
        ShortName: v.id,
        Gender: v.gender,
        Locale: v.language,
        LanguageLabel: v.languageLabel,
    }));
}

// ─── LEGACY speaker → language resolution (for old string-based voiceId) ──
const LEGACY_SPEAKER_LANG: Record<string, string> = {
    "meera": "hi-IN", "pavithra": "hi-IN", "maitreyi": "hi-IN",
    "arvind": "hi-IN", "amol": "hi-IN", "amartya": "hi-IN",
    "ravi": "hi-IN", "anjali": "hi-IN", "rahul": "hi-IN",
};

// ─── API FUNCTIONS ────────────────────────────────────────────────

/**
 * 1. SPEECH-TO-TEXT WITH TRANSLATION (Audio → English Text)
 */
export async function processAudioWithSarvam(audioBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([audioBuffer as any], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "saaras:v1");
    formData.append("prompt", "");

    const res = await fetch(`${BASE_URL}/speech-to-text-translate`, {
        method: "POST",
        headers: HEADERS,
        body: formData,
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "unknown");
        throw new Error(`[Sarvam STT] Error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.transcript || "";
}

/**
 * 2. TEXT TRANSLATION (English → Target Language)
 * Uses the voice's language code so the agent speaks the right language.
 */
export async function translateText(
    englishText: string,
    targetLang: string = "hi-IN"
): Promise<string> {
    // Don't translate if target is English
    if (targetLang === "en-IN") return englishText;

    const res = await fetch(`${BASE_URL}/translate`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
            input: englishText,
            source_language_code: "en-IN",
            target_language_code: targetLang,
            speaker_gender: "Female",
            mode: "formal",
            model: "sarvam-translate:v1",
        }),
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "unknown");
        throw new Error(`[Sarvam Translate] Error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.translated_text || englishText;
}

// Legacy Hindi-only alias
export async function translateTextToHindi(text: string): Promise<string> {
    return translateText(text, "hi-IN");
}

/**
 * 3. TEXT-TO-SPEECH  (Indic Text → Audio)
 * voiceId can be the new compound ID ("meera-ta") or legacy speaker name ("meera").
 * Language code is derived automatically from the voice definition.
 */
export async function generateSpeechWithSarvam(
    text: string,
    voiceId: string = "meera-hi"
): Promise<Buffer> {
    let speaker = voiceId;
    let langCode = "hi-IN";

    // Try compound voice ID first (preferred)
    const voice = SARVAM_VOICES.find(v => v.id === voiceId);
    if (voice) {
        speaker = voice.speaker;
        langCode = voice.language;
    } else {
        // Fallback: treat voiceId as raw speaker name + resolve language
        langCode = LEGACY_SPEAKER_LANG[voiceId] || "hi-IN";
    }

    const res = await fetch(`${BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: langCode,
            speaker,
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 16000,
            enable_preprocessing: true,
            model: "bulbul:v1",
        }),
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "unknown");
        throw new Error(`[Sarvam TTS] Error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const base64Audio = data.audios?.[0];
    if (!base64Audio) throw new Error("[Sarvam TTS] No audio returned from API");

    return Buffer.from(base64Audio, "base64");
}
