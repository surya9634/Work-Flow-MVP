import { synthesizeSpeech } from '../../lib/tts-server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable } from 'stream';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function test() {
    try {
        const base64Audio = await synthesizeSpeech("Testing ffmpeg transcode", 'en-US-AriaNeural');
        const audioBuffer = Buffer.from(base64Audio, "base64");

        console.log("Got MP3 buffer:", audioBuffer.length);

        const readableAudio = new Readable();
        readableAudio.push(audioBuffer);
        readableAudio.push(null);

        const chunks: Buffer[] = [];

        await new Promise((resolve, reject) => {
            ffmpeg(readableAudio)
                .inputFormat('mp3')
                .outputFormat('mulaw')
                .audioFrequency(8000)
                .audioChannels(1)
                .audioCodec('pcm_mulaw')
                .on('error', (err) => {
                    console.error("FFMPEG Error:", err);
                    reject(err);
                })
                .on('end', () => {
                    console.log("FFMPEG transcode complete!");
                    resolve(true);
                })
                .pipe()
                .on('data', (chunk) => {
                    chunks.push(chunk);
                });
        });

        const finalBuffer = Buffer.concat(chunks);
        console.log("Final mulaw buffer length:", finalBuffer.length);
    } catch (e) {
        console.error("Test failed", e);
    }
}
test();
