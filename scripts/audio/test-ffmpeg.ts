import { synthesizeSpeech } from '../../lib/tts-server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable } from 'stream';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function testFfmpeg() {
    try {
        console.log("Synthesizing speech...");
        const audioBase64 = await synthesizeSpeech("Testing the voice streaming.", "en-US-AriaNeural");
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        console.log(`Speech synthesized! Length: ${audioBuffer.length} bytes`);

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
            ffStream.on('data', (chunk: Buffer) => chunks.push(chunk));
            ffStream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        console.log("Audio transcode successful! Mulaw bytes:", mulawBuffer.length);
    } catch (e) {
        console.error("Crash during TTS or FFMPEG:", e);
    }
}
testFfmpeg();
