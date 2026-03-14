import { createClient } from "@deepgram/sdk";

const apiKey = process.env.DEEPGRAM_API_KEY;

export async function processAudioWithDeepgram(audioBuffer: Buffer): Promise<string> {
    if (!apiKey) {
        console.warn("DEEPGRAM_API_KEY is not set. STT will fall back to empty.");
        return "";
    }
    const deepgram = createClient(apiKey);
    
    // Deepgram prerecorded API accepts a buffer with a mimetype payload
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
            model: "nova-2",
            smart_format: true,
        }
    );
    
    if (error) {
        console.error("[Deepgram STT] Error parsing audio", error);
        throw error;
    }
    
    return result?.results?.channels[0]?.alternatives[0]?.transcript || "";
}

export async function generateSpeechWithDeepgram(text: string, voiceId: string = "aura-asteria-en"): Promise<Buffer> {
    if (!apiKey) {
        console.warn("DEEPGRAM_API_KEY is not set. TTS will fall back to empty buffer.");
        return Buffer.from("");
    }
    const deepgram = createClient(apiKey);
    
    const response = await deepgram.speak.request(
        { text },
        {
            model: voiceId,
            encoding: "linear16",
            container: "wav"
        }
    );

    const stream = await response.getStream();
    if (!stream) {
        throw new Error("Deepgram TTS failed to fetch stream");
    }

    // Convert Web ReadableStream to NodeJS Buffer
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }

    return Buffer.concat(chunks);
}
