/**
 * SARVAM AI SERVICE
 *
 * REST API client for Sarvam AI — India's leading foundational AI models.
 * Used for natively handling Hindi, Hinglish, and other Indic languages.
 *
 * Pipeline:
 * 1. Audio (Hindi/Hinglish) → STT Translate → English Text
 * 2. LLM (Groq) processes English Text → outputs English Text
 * 3. English Text → Sarvam Translate → Hindi Text
 * 4. Hindi Text → Sarvam TTS (Bulbul v3) → Audio (Hindi/Hinglish)
 */

const API_KEY = process.env.SARVAM_API_KEY || "";
const BASE_URL = "https://api.sarvam.ai";

const HEADERS = {
    "api-subscription-key": API_KEY,
};

/**
 * 1. SPEECH-TO-TEXT WITH TRANSLATION (Audio → English Text)
 * Uses Sarvam's 'saaras:v1' model to transcribe Indic audio and translate it directly to English.
 */
export async function processAudioWithSarvam(audioBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    // In Node.js environment with native fetch, Blob accepts Buffer directly
    const blob = new Blob([audioBuffer as any], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "saaras:v1");
    // 'translate' mode converts spoken Hindi directly to English text for the LLM
    formData.append("prompt", ""); // Optional hint

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
 * 2. TEXT TRANSLATION (English Text → Hindi Text)
 * Uses Sarvam's translation model to perfectly localize the LLM's English response into Hindi.
 */
export async function translateTextToHindi(englishText: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/translate`, {
        method: "POST",
        headers: {
            ...HEADERS,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input: englishText,
            source_language_code: "en-IN",
            target_language_code: "hi-IN",
            speaker_gender: "Female", // Can be parameterized if needed
            mode: "formal",
            model: "sarvam-translate:v1"
        }),
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "unknown");
        throw new Error(`[Sarvam Translate] Error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.translated_text || englishText; // Fallback to English if translation fails
}

/**
 * 3. TEXT-TO-SPEECH (Hindi Text → Hindi Audio)
 * Uses Sarvam's 'bulbul:v3' model to generate highly realistic, native Indian TTS.
 */
export async function generateSpeechWithSarvam(
    indicText: string,
    voiceId: string = "meera"
): Promise<Buffer> {
    const res = await fetch(`${BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: {
            ...HEADERS,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: [indicText],
            target_language_code: "hi-IN", // Ensure this matches the translation output
            speaker: voiceId,
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 16000,
            enable_preprocessing: true,
            model: "bulbul:v1"
        }),
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "unknown");
        throw new Error(`[Sarvam TTS] Error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const base64Audio = data.audios?.[0];
    
    if (!base64Audio) {
        throw new Error("[Sarvam TTS] No audio returned from API");
    }

    return Buffer.from(base64Audio, "base64");
}

/**
 * Get available Sarvam TTS voices (Speakers)
 */
export function getSarvamVoices() {
    return [
        { Name: "Meera (Hindi Female)", ShortName: "meera", Gender: "Female", Locale: "hi-IN" },
        { Name: "Ravi (Hindi Male)",    ShortName: "ravi",  Gender: "Male",   Locale: "hi-IN" },
        { Name: "Anjali (Hindi Female)", ShortName: "anjali", Gender: "Female", Locale: "hi-IN" },
        { Name: "Rahul (Hindi Male)",   ShortName: "rahul", Gender: "Male",   Locale: "hi-IN" },
    ];
}
