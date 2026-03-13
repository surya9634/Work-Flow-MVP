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
    // { id: "anushka-hi",  speaker: "anushka",  language: "hi-IN", languageLabel: "Hindi", name: "Anushka (Hindi)", gender: "Female" },
    // { id: "abhilash-hi", speaker: "abhilash", language: "hi-IN", languageLabel: "Hindi", name: "Abhilash (Hindi)", gender: "Male" },
    { id: "priya-hi",    speaker: "priya",    language: "hi-IN", languageLabel: "Hindi", name: "Priya (Hindi)", gender: "Female" },
    { id: "rahul-hi",    speaker: "rahul",    language: "hi-IN", languageLabel: "Hindi", name: "Rahul (Hindi)", gender: "Male" },
    { id: "neha-hi",     speaker: "neha",     language: "hi-IN", languageLabel: "Hindi", name: "Neha (Hindi)", gender: "Female" },
    { id: "rohan-hi",    speaker: "rohan",    language: "hi-IN", languageLabel: "Hindi", name: "Rohan (Hindi)", gender: "Male" },

    // ── Bengali (bn-IN) ────────────────────────────────
    // { id: "manisha-bn",  speaker: "manisha",  language: "bn-IN", languageLabel: "Bengali", name: "Manisha (Bengali)", gender: "Female" },
    { id: "amit-bn",     speaker: "amit",     language: "bn-IN", languageLabel: "Bengali", name: "Amit (Bengali)", gender: "Male" },
    { id: "shreya-bn",   speaker: "shreya",   language: "bn-IN", languageLabel: "Bengali", name: "Shreya (Bengali)", gender: "Female" },
    { id: "dev-bn",      speaker: "dev",      language: "bn-IN", languageLabel: "Bengali", name: "Dev (Bengali)", gender: "Male" },

    // ── Gujarati (gu-IN) ───────────────────────────────
    { id: "vidya-gu",    speaker: "vidya",    language: "gu-IN", languageLabel: "Gujarati", name: "Vidya (Gujarati)", gender: "Female" },
    { id: "varun-gu",    speaker: "varun",    language: "gu-IN", languageLabel: "Gujarati", name: "Varun (Gujarati)", gender: "Male" },
    { id: "pooja-gu",    speaker: "pooja",    language: "gu-IN", languageLabel: "Gujarati", name: "Pooja (Gujarati)", gender: "Female" },

    // ── Kannada (kn-IN) ────────────────────────────────
    { id: "arya-kn",     speaker: "arya",     language: "kn-IN", languageLabel: "Kannada", name: "Arya (Kannada)", gender: "Female" },
    { id: "manan-kn",    speaker: "manan",    language: "kn-IN", languageLabel: "Kannada", name: "Manan (Kannada)", gender: "Male" },
    { id: "simran-kn",   speaker: "simran",   language: "kn-IN", languageLabel: "Kannada", name: "Simran (Kannada)", gender: "Female" },
    { id: "sumit-kn",    speaker: "sumit",    language: "kn-IN", languageLabel: "Kannada", name: "Sumit (Kannada)", gender: "Male" },

    // ── Malayalam (ml-IN) ──────────────────────────────
    { id: "kavya-ml",    speaker: "kavya",    language: "ml-IN", languageLabel: "Malayalam", name: "Kavya (Malayalam)", gender: "Female" },
    { id: "hitesh-ml",   speaker: "hitesh",   language: "ml-IN", languageLabel: "Malayalam", name: "Hitesh (Malayalam)", gender: "Male" },
    { id: "roopa-ml",    speaker: "roopa",    language: "ml-IN", languageLabel: "Malayalam", name: "Roopa (Malayalam)", gender: "Female" },

    // ── Marathi (mr-IN) ────────────────────────────────
    { id: "ishita-mr",   speaker: "ishita",   language: "mr-IN", languageLabel: "Marathi", name: "Ishita (Marathi)", gender: "Female" },
    { id: "kabir-mr",    speaker: "kabir",    language: "mr-IN", languageLabel: "Marathi", name: "Kabir (Marathi)", gender: "Male" },
    { id: "ritu-mr",     speaker: "ritu",     language: "mr-IN", languageLabel: "Marathi", name: "Ritu (Marathi)", gender: "Female" },
    { id: "aayan-mr",    speaker: "aayan",    language: "mr-IN", languageLabel: "Marathi", name: "Aayan (Marathi)", gender: "Male" },

    // ── Odia (od-IN) ───────────────────────────────────
    { id: "amelia-od",   speaker: "amelia",   language: "od-IN", languageLabel: "Odia", name: "Amelia (Odia)", gender: "Female" },
    { id: "aditya-od",   speaker: "aditya",   language: "od-IN", languageLabel: "Odia", name: "Aditya (Odia)", gender: "Male" },

    // ── Punjabi (pa-IN) ────────────────────────────────
    { id: "sophia-pa",   speaker: "sophia",   language: "pa-IN", languageLabel: "Punjabi", name: "Sophia (Punjabi)", gender: "Female" },
    { id: "anand-pa",    speaker: "anand",    language: "pa-IN", languageLabel: "Punjabi", name: "Anand (Punjabi)", gender: "Male" },
    { id: "tanya-pa",    speaker: "tanya",    language: "pa-IN", languageLabel: "Punjabi", name: "Tanya (Punjabi)", gender: "Female" },

    // ── Tamil (ta-IN) ──────────────────────────────────
    { id: "shruti-ta",   speaker: "shruti",   language: "ta-IN", languageLabel: "Tamil", name: "Shruti (Tamil)", gender: "Female" },
    { id: "tarun-ta",    speaker: "tarun",    language: "ta-IN", languageLabel: "Tamil", name: "Tarun (Tamil)", gender: "Male" },
    { id: "suhani-ta",   speaker: "suhani",   language: "ta-IN", languageLabel: "Tamil", name: "Suhani (Tamil)", gender: "Female" },
    { id: "sunny-ta",    speaker: "sunny",    language: "ta-IN", languageLabel: "Tamil", name: "Sunny (Tamil)", gender: "Male" },

    // ── Telugu (te-IN) ─────────────────────────────────
    { id: "kavitha-te",  speaker: "kavitha",  language: "te-IN", languageLabel: "Telugu", name: "Kavitha (Telugu)", gender: "Female" },
    { id: "mani-te",     speaker: "mani",     language: "te-IN", languageLabel: "Telugu", name: "Mani (Telugu)", gender: "Male" },
    { id: "rupali-te",   speaker: "rupali",   language: "te-IN", languageLabel: "Telugu", name: "Rupali (Telugu)", gender: "Female" },
    { id: "gokul-te",    speaker: "gokul",    language: "te-IN", languageLabel: "Telugu", name: "Gokul (Telugu)", gender: "Male" },

    // ── English / Indian English (en-IN) ───────────────
    // { id: "anushka-en",  speaker: "anushka",  language: "en-IN", languageLabel: "English", name: "Anushka (English)", gender: "Female" },
    // { id: "abhilash-en", speaker: "abhilash", language: "en-IN", languageLabel: "English", name: "Abhilash (English)", gender: "Male" },
    { id: "priya-en",    speaker: "priya",    language: "en-IN", languageLabel: "English", name: "Priya (English)", gender: "Female" },
    { id: "rahul-en",    speaker: "rahul",    language: "en-IN", languageLabel: "English", name: "Rahul (English)", gender: "Male" },
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
    "meera": "hi-IN", "anushka": "hi-IN", "abhilash": "hi-IN",
    "manisha": "bn-IN", "vidya": "gu-IN", "arya": "kn-IN"
};

// Map old v1 voice IDs (like 'meera-hi') to the new v3 voice IDs (like 'priya-hi')
const LEGACY_VOICE_MAP: Record<string, string> = {
    // Hindi
    "meera-hi": "priya-hi",
    "anushka-hi": "priya-hi",
    "pavithra-hi": "neha-hi",
    "maitreyi-hi": "shreya-hi", // mapping to an available female voice
    "arvind-hi": "rahul-hi",
    "abhilash-hi": "rahul-hi",
    "amol-hi": "rohan-hi",
    "amartya-hi": "dev-hi", // dev-bn equivalent or just pick another male hindi voice
    
    // Default fallback if a specific translation isn't listed
    // (You can add more specific mappings here if needed)
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
    voiceId: string = "priya-hi"
): Promise<Buffer> {
    // Map legacy ids directly to the new ids seamlessly
    const robustVoiceId = LEGACY_VOICE_MAP[voiceId] || voiceId;
    
    let speaker = robustVoiceId;
    let langCode = "hi-IN";

    // Try compound voice ID first (preferred)
    const voice = SARVAM_VOICES.find(v => v.id === robustVoiceId);
    if (voice) {
        speaker = voice.speaker;
        langCode = voice.language;
    } else {
        // Fallback: treat voiceId as raw speaker name + resolve language
        langCode = LEGACY_SPEAKER_LANG[robustVoiceId] || "hi-IN";
    }

    // Safety fallback for bulbul:v3 allowed speakers
    const allowedSpeakers = [
        "vidya", "arya", "karun", "hitesh", "aditya", "ritu", "priya", "neha", "rahul", "pooja", "rohan", "simran", 
        "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", "manan", "sumit", "roopa", "kabir", "aayan", 
        "shubh", "ashutosh", "advait", "amelia", "sophia", "anand", "tanya", "tarun", "sunny", "mani", "gokul", 
        "vijay", "shruti", "suhani", "mohit", "kavitha", "rehan", "soham", "rupali"
    ];

    if (!allowedSpeakers.includes(speaker)) {
        console.warn(`[Sarvam TTS] Invalid speaker requested: ${speaker}. Falling back to 'priya'.`);
        speaker = "priya";
    }

    const res = await fetch(`${BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: langCode,
            speaker,
            pace: 1.0,
            speech_sample_rate: 16000,
            enable_preprocessing: true,
            model: "bulbul:v3",
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
