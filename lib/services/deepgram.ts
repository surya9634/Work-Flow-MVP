import { DeepgramClient } from "@deepgram/sdk";

const apiKey = process.env.DEEPGRAM_API_KEY;

export async function processAudioWithDeepgram(audioBuffer: Buffer): Promise<string> {
    if (!apiKey) {
        console.warn("[Deepgram STT] DEEPGRAM_API_KEY is not set. Falling back to empty transcript.");
        return "";
    }

    const deepgram = new DeepgramClient({ apiKey });

    // transcribeFile returns HttpResponsePromise<MediaTranscribeResponse>
    // HttpResponsePromise extends Promise<T>, so await resolves to MediaTranscribeResponse directly
    const transcription = await deepgram.listen.v1.media.transcribeFile(
        audioBuffer,
        {
            model: "nova-2",
            smart_format: true,
        }
    );

    // MediaTranscribeResponse is ListenV1Response | ListenV1AcceptedResponse
    // ListenV1Response has { metadata, results }
    const response = transcription as { results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> } };
    return response?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
}

export async function generateSpeechWithDeepgram(text: string, voiceId: string = "aura-asteria-en"): Promise<Buffer> {
    if (!apiKey) {
        console.warn("[Deepgram TTS] DEEPGRAM_API_KEY is not set. Falling back to empty buffer.");
        return Buffer.from("");
    }

    const deepgram = new DeepgramClient({ apiKey });

    // generate returns HttpResponsePromise<BinaryResponse>
    // BinaryResponse is a Blob — we can call .arrayBuffer() on it
    const audio = await deepgram.speak.v1.audio.generate(
        {
            text,
            model: voiceId,
        }
    );

    // Convert Blob to Node.js Buffer
    const arrayBuffer = await (audio as unknown as Blob).arrayBuffer();
    return Buffer.from(arrayBuffer);
}
