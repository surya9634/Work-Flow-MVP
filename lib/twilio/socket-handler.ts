import { WebSocket } from "ws";
import { VoiceRuntime } from "../services/voice-runtime";
import { prisma } from "../prisma";
import { io } from "../../server";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable } from 'stream';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import { synthesizeSpeech } from '../tts-server';
import { storeAudio } from '../audio-store';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Handles an active Twilio Media Stream WebSocket.
 *
 * ARCHITECTURE:
 * - Greeting: Handled instantly by TwiML <Say> (no delay)
 * - User Speech: Captured via WebSocket media stream
 * - AI Response: When user finishes speaking, we use Twilio's REST API to
 *   redirect the live call to a new <Say> (AI response) + <Connect><Stream>
 *   (next turn). This sidesteps the FFMPEG/mulaw streaming pipeline entirely,
 *   which was too slow and caused Twilio to hang up before audio arrived.
 */
export class TwilioCallManager {
    private ws: WebSocket;
    private streamSid: string | null = null;
    private callSid: string | null = null;
    private audioBuffer: string[] = [];
    private silenceThreshold = 100; // ~2s of silence at 50 chunks/sec
    private silenceCount = 0;
    private speechCount = 0;
    private isProcessing = false;
    private isGreetingInProgress = true; // Block audio until greeting finishes

    private session = VoiceRuntime.createSession("twilio-test", "Twilio Caller");
    private systemPrompt = "You are an AI assistant answering a phone call. Be extremely brief and conversational.";
    private convTree = {};
    private voiceProfile = {};
    private currentLeadName = "there";
    private agentId = "";
    private leadId = "";
    private voiceId = "en-US-AriaNeural"; // Default voice, overridden by agent voiceProfile

    constructor(ws: WebSocket) {
        this.ws = ws;
    }

    public async handleMessage(msg: any) {
        switch (msg.event) {
            case "start":
                this.streamSid = msg.start.streamSid;
                this.callSid = msg.start.callSid;
                console.log(`[TwilioCallManager] Stream started. CallSid: ${this.callSid}`);

                const customParams = msg.start.customParameters || {};
                this.agentId = customParams.agentId || "";
                this.leadId = customParams.leadId || "";
                const greetingDone = customParams.greetingDone === "true";
                if (customParams.leadName) this.currentLeadName = customParams.leadName;

                if (io) {
                    io.emit("callStart", { callSid: this.callSid, agentId: this.agentId, leadId: this.leadId });
                }

                await this.loadContext(this.agentId, this.leadId);

                if (greetingDone) {
                    // Start listening immediately
                    console.log(`[TwilioCallManager] Greeting done. Listening for user speech.`);
                    this.isGreetingInProgress = false;
                } else {
                    // Generate and stream greeting immediately
                    const greetingText = `Hi There ${this.currentLeadName}... How have you been doing?`;
                    this.isGreetingInProgress = true;
                    await this.streamAudioToTwilio(greetingText);
                    this.isGreetingInProgress = false;
                    console.log(`[TwilioCallManager] Greeting done. Now listening for user speech.`);
                }
                break;

            case "media":
                this.handleIncomingAudio(msg.media.payload);
                break;

            case "stop":
                console.log(`[TwilioCallManager] Stream stopped.`);
                if (io) {
                    io.emit("callEnd", { callSid: this.callSid });
                }
                break;
        }
    }

    private async handleIncomingAudio(payload: string) {
        // Block all audio during greeting to prevent Twilio's initial burst from
        // triggering the silence detector before the AI has even spoken.
        if (this.isGreetingInProgress || this.isProcessing) return;

        const audioBytes = Buffer.from(payload, "base64");

        let totalVolume = 0;
        for (let i = 0; i < audioBytes.length; i++) {
            const b = audioBytes[i];
            const magnitude = b >= 128 ? 255 - b : 127 - b;
            totalVolume += magnitude;
        }
        const avgVolume = totalVolume / audioBytes.length;
        const isSpeaking = avgVolume > 20;

        if (isSpeaking) {
            this.audioBuffer.push(payload);
            this.silenceCount = 0;
            this.speechCount++;
        } else {
            this.silenceCount++;
            this.speechCount = 0;
            if (this.audioBuffer.length > 0) {
                this.audioBuffer.push(payload);
            }
        }

        if (this.silenceCount > this.silenceThreshold && this.audioBuffer.length > 0 && !this.isProcessing) {
            await this.processTurn();
        }
    }

    private async processTurn() {
        this.isProcessing = true;

        try {
            if (this.audioBuffer.length < 20) {
                console.log(`[TwilioCallManager] Buffer too short. Discarding noise.`);
                this.audioBuffer = [];
                return;
            }

            console.log(`[TwilioCallManager] Processing ${this.audioBuffer.length} audio chunks via STT...`);

            const bufferArray = this.audioBuffer.map(b64 => Buffer.from(b64, "base64"));
            const audioBytes = Buffer.concat(bufferArray);
            this.audioBuffer = [];

            // Transcode mulaw -> wav for Groq Whisper STT
            const wavBuffer = await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                const readableStream = new Readable();
                readableStream.push(audioBytes);
                readableStream.push(null);

                const command = ffmpeg(readableStream)
                    .inputFormat('mulaw')
                    .inputOptions(['-ar 8000', '-ac 1'])
                    .outputFormat('wav')
                    .on('error', reject);

                const ffStream = command.pipe();
                ffStream.on('data', (chunk) => chunks.push(chunk));
                ffStream.on('end', () => resolve(Buffer.concat(chunks)));
            });

            const result = await VoiceRuntime.processTurn(
                this.session,
                wavBuffer,
                this.systemPrompt,
                this.convTree,
                this.voiceProfile
            );

            if (!result.text || result.text.trim().length === 0) {
                console.log(`[TwilioCallManager] Empty LLM response, ignoring.`);
                return;
            }

            console.log(`[TwilioCallManager] AI Response: "${result.text}"`);

            if (io) {
                if (this.session.transcript.length >= 2) {
                    const humanMsg = this.session.transcript[this.session.transcript.length - 2];
                    const agentMsg = this.session.transcript[this.session.transcript.length - 1];
                    if (humanMsg.startsWith("Lead:") || humanMsg.startsWith("Lead (simulated):")) {
                        io.emit("turn", { callSid: this.callSid, role: "human", text: humanMsg.replace(/^(Lead|Lead \(simulated\)):\s*/, "") });
                    }
                    if (agentMsg.startsWith("Agent:")) {
                        io.emit("turn", { callSid: this.callSid, role: "agent", text: agentMsg.replace("Agent: ", "") });
                    }
                }
            }

            // Speak AI response using the agent's custom voice via streaming
            await this.streamAudioToTwilio(result.text);

        } catch (error) {
            console.error("[TwilioCallManager] Turn processing failed:", error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate audio via edge-tts, transcode it from MP3 to mulaw via FFMPEG,
     * and stream it over the WebSocket back to the caller in small chunks.
     * This keeps the connection alive and enables two-way streaming.
     */
    private async streamAudioToTwilio(text: string) {
        if (!this.streamSid || !this.callSid) {
            console.error("[TwilioCallManager] Cannot stream: missing streamSid");
            return;
        }

        try {
            console.log(`[TwilioCallManager] Generating custom TTS audio (streaming) for: "${text.substring(0, 60)}..."`);
            const audioBase64 = await synthesizeSpeech(text, this.voiceId);
            const audioBuffer = Buffer.from(audioBase64, 'base64');

            // Convert MP3 Buffer to mulaw 8000Hz 1-channel for Twilio
            const mulawBuffer = await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                const readableStream = new Readable();
                readableStream.push(audioBuffer);
                readableStream.push(null);

                const command = ffmpeg(readableStream)
                    .inputFormat('mp3')
                    .outputFormat('mulaw')
                    .audioFrequency(8000)
                    .audioChannels(1)
                    .on('error', reject);

                const ffStream = command.pipe();
                ffStream.on('data', (chunk) => chunks.push(chunk));
                ffStream.on('end', () => resolve(Buffer.concat(chunks)));
            });

            // Twilio recommends small payload blocks (e.g. 20ms = ~160 bytes)
            // But 200ms-400ms chunks work reliably without flooding the socket.
            const chunkSize = 1600; // 200ms of 8000hz 8-bit audio

            for (let i = 0; i < mulawBuffer.length; i += chunkSize) {
                const chunk = mulawBuffer.subarray(i, i + chunkSize);
                this.ws.send(JSON.stringify({
                    event: "media",
                    streamSid: this.streamSid,
                    media: { payload: chunk.toString('base64') }
                }));
            }

            // Add a "mark" message so we know when audio completes (optional)
            this.ws.send(JSON.stringify({
                event: "mark",
                streamSid: this.streamSid,
                mark: { name: `end_audio_${Date.now()}` }
            }));

            console.log(`[TwilioCallManager] Finished streaming ${mulawBuffer.length} bytes of audio to Twilio.`);
        } catch (err) {
            console.error("[TwilioCallManager] Failed to stream TTS audio:", err);
            // Ignore error or stream a static error message mulaw block.
        }
    }

    private async loadContext(agentId?: string, leadId?: string) {
        try {
            let agent = null;
            if (agentId) {
                agent = await prisma.agent.findUnique({ where: { id: agentId } });
            } else {
                agent = await prisma.agent.findFirst();
            }

            if (agent) {
                this.session = VoiceRuntime.createSession(agent.id, leadId || "unknown");
                this.systemPrompt = agent.systemPrompt || "You are an AI assistant.";

                let convTreeParsed = {};
                if (typeof agent.convTree === "string") {
                    convTreeParsed = JSON.parse(agent.convTree);
                } else if (agent.convTree) {
                    convTreeParsed = agent.convTree as object;
                }

                let voiceProfileParsed = {};
                if (typeof agent.voiceProfile === "string") {
                    voiceProfileParsed = JSON.parse(agent.voiceProfile);
                } else if (agent.voiceProfile) {
                    voiceProfileParsed = agent.voiceProfile as object;
                }

                this.convTree = convTreeParsed;
                this.voiceProfile = voiceProfileParsed;

                // Extract the voice ID from the agent's voice profile
                const vp = voiceProfileParsed as any;
                if (vp?.voiceId) this.voiceId = vp.voiceId;
                else if (vp?.voice) this.voiceId = vp.voice;

                if (leadId) {
                    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
                    if (lead?.name) this.currentLeadName = lead.name;
                }

                console.log(`[TwilioCallManager] Loaded Agent: ${agent.name}, Lead: ${this.currentLeadName}, Voice: ${this.voiceId}`);
            } else {
                console.warn(`[TwilioCallManager] No agent found.`);
            }
        } catch (error) {
            console.error("[TwilioCallManager] Failed to load context:", error);
        }
    }
}
