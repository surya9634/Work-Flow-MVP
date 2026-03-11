import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * PRODUCTION REALISTIC TTS ENGINE (Python Wrapper)
 * Uses the stable Python edge-tts library to generate human-grade speech.
 */
export async function synthesizeSpeech(text: string, voiceId: string = 'en-US-AriaNeural'): Promise<string> {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(os.tmpdir(), `tts_${uuidv4()}.mp3`);
        // Use the absolute path discovered during diagnostic
        const edgeTtsPath = 'C:\\Users\\ssrss\\AppData\\Roaming\\Python\\Python313\\Scripts\\edge-tts.exe';

        console.log(`[PythonTTS] Generating speech: ${voiceId}`);

        const child = spawn(edgeTtsPath, [
            '--text', text,
            '--voice', voiceId,
            '--write-media', tempFile
        ]);

        child.on('close', (code) => {
            if (code === 0 && fs.existsSync(tempFile)) {
                try {
                    const audioBase64 = fs.readFileSync(tempFile, { encoding: 'base64' });
                    // Clean up temp file
                    fs.unlinkSync(tempFile);
                    resolve(audioBase64);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error(`edge-tts failed with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}
