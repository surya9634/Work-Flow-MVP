/**
 * CARTESIA TTS ENGINE
 *
 * Uses Cartesia's Sonic model via their REST API to generate high-quality,
 * low-latency speech. Requires CARTESIA_API_KEY in the environment.
 *
 * API docs: https://docs.cartesia.ai/api-reference/tts/bytes
 */

// ─── Cartesia Voice Library (curated defaults) ──────────────────────────────
// Browse all voices at https://play.cartesia.ai
// These are stable public voice UUIDs from Cartesia's voice library.
export const CARTESIA_VOICES = {
    // English – Female
    "en-female-professional": "a0e99841-438c-4a64-b679-ae501e7d6091",  // Barbra — professional, warm US female
    "en-female-friendly":     "b7d50908-b17c-442d-ad8d-810c63997ed9",  // Friendly US female
    "en-female-casual":       "79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e",  // Casual US female
    // English – Male
    "en-male-professional":   "c45bc1d0-c817-4b9c-be6e-3a04e5bdfd44",  // Professional US male
    "en-male-friendly":       "ee7ea9f8-c0c1-498c-9279-764d6b56d189",  // Friendly US male
    "en-male-casual":         "87748186-23bb-4158-a1eb-332911b0b708",  // Casual US male
} as const;

// Default voice for the AI agent
export const DEFAULT_CARTESIA_VOICE_ID = CARTESIA_VOICES["en-female-professional"];

// Legacy Edge-TTS voice ID → Cartesia UUID shim
// Allows any old `en-US-AriaNeural`-style IDs stored in the DB to keep working.
const EDGE_TTS_COMPAT: Record<string, string> = {
    "en-US-AriaNeural":     CARTESIA_VOICES["en-female-professional"],
    "en-US-JennyNeural":    CARTESIA_VOICES["en-female-friendly"],
    "en-US-SaraNeural":     CARTESIA_VOICES["en-female-casual"],
    "en-US-GuyNeural":      CARTESIA_VOICES["en-male-professional"],
    "en-US-DavisNeural":    CARTESIA_VOICES["en-male-friendly"],
    "en-US-SteffanNeural":  CARTESIA_VOICES["en-male-casual"],
    "en-GB-SoniaNeural":    CARTESIA_VOICES["en-female-professional"],
    "en-GB-RyanNeural":     CARTESIA_VOICES["en-male-professional"],
    "en-AU-NatashaNeural":  CARTESIA_VOICES["en-female-casual"],
    "hi-IN-SwaraNeural":    CARTESIA_VOICES["en-female-professional"],
    "hi-IN-MadhurNeural":   CARTESIA_VOICES["en-male-professional"],
};

/**
 * Resolve a voice ID: if it looks like a legacy Edge-TTS name, map it;
 * if it's already a UUID, use it as-is; otherwise fall back to the default.
 */
function resolveVoiceId(voiceId: string): string {
    if (EDGE_TTS_COMPAT[voiceId]) return EDGE_TTS_COMPAT[voiceId];
    // Looks like a UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    if (/^[0-9a-f-]{36}$/i.test(voiceId)) return voiceId;
    return DEFAULT_CARTESIA_VOICE_ID;
}

/**
 * Synthesize speech using Cartesia's TTS API.
 *
 * @param text    - The text to speak.
 * @param voiceId - A Cartesia voice UUID, or a legacy Edge-TTS name (auto-mapped).
 * @returns       Base64-encoded MP3 audio string.
 */
export async function synthesizeSpeech(
    text: string,
    voiceId: string = DEFAULT_CARTESIA_VOICE_ID
): Promise<string> {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey || apiKey === "your_cartesia_api_key_here") {
        throw new Error("[CartesiaTTS] CARTESIA_API_KEY is not set in environment variables.");
    }

    const resolvedVoiceId = resolveVoiceId(voiceId);
    console.log(`[CartesiaTTS] Synthesizing with voice=${resolvedVoiceId} (requested: ${voiceId})`);

    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
            "Cartesia-Version": "2024-06-10",
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model_id: "sonic-2",
            transcript: text,
            voice: {
                mode: "id",
                id: resolvedVoiceId,
            },
            output_format: {
                container: "mp3",
                encoding: "mp3",
                sample_rate: 44100,
            },
            language: "en",
        }),
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => "unknown");
        throw new Error(`[CartesiaTTS] API error ${response.status}: ${errBody}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer).toString("base64");
}
