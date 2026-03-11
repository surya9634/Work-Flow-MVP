import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { synthesizeSpeech } from './lib/tts-server.js'; // Ensure file exists
import fs from 'fs';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function testTTS() {
    try {
        console.log("Synthesizing speech...");
        const audioBase64 = await synthesizeSpeech("Testing the voice streaming.", "en-US-AriaNeural");
        console.log(`Speech synthesized! Length: ${audioBase64.length}`);

        fs.writeFileSync("test.mp3", Buffer.from(audioBase64, 'base64'));
        console.log("Audio transcode successful!");
    } catch (e) {
        console.error("Crash during TTS or FFMPEG:", e);
    }
}
testTTS();
