const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

/**
 * Enhanced Raw Edge-TTS Client
 * Skips libraries to ensure stability on Windows/Terminal environments.
 */
async function synthesize(text, voice = 'en-US-AriaNeural') {
    return new Promise((resolve, reject) => {
        const requestId = uuidv4().replace(/-/g, '').toUpperCase();
        const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D314BE44E1&ConnectionId=${requestId}`;

        console.log(`[EdgeTTS] Connecting to ${url}...`);

        const ws = new WebSocket(url, {
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                'Origin': 'chrome-extension://jdiccldabgehpocnhihgeemjnkgmjdno'
            }
        });

        let audioBuffer = Buffer.alloc(0);
        let headerFinished = false;

        ws.on('open', () => {
            console.log("[EdgeTTS] WebSocket Open. Sending config...");
            const date = new Date().toUTCString();

            // 1. Send Configuration
            const configMsg = `X-Timestamp:${date}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"voice":{"cache":{"type":"SessionStateSharedCookieCheck"}}}}}\r\n`;
            ws.send(configMsg);

            // 2. Send SSML
            const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody rate='0%' pitch='0%'>${text}</prosody></voice></speak>`;
            const ssmlMsg = `X-RequestId:${requestId}\r\nX-Timestamp:${date}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}\r\n`;
            ws.send(ssmlMsg);
        });

        ws.on('message', (data, isBinary) => {
            if (isBinary) {
                // Binary message format: 2 bytes header length (N) + N bytes header (Path:audio) + audio data
                const headerLength = data.readInt16BE(0);
                const header = data.slice(2, headerLength + 2).toString();
                if (header.includes("Path:audio")) {
                    const audioChunk = data.slice(headerLength + 2);
                    audioBuffer = Buffer.concat([audioBuffer, audioChunk]);
                }
            } else {
                const head = data.toString();
                if (head.includes('Path:turn.end')) {
                    console.log("[EdgeTTS] Synthesis Complete.");
                    ws.close();
                    resolve(audioBuffer);
                }
            }
        });

        ws.on('error', (err) => {
            console.error("[EdgeTTS] WebSocket Error:", err);
            reject(err);
        });

        ws.on('close', () => {
            if (audioBuffer.length === 0) {
                reject(new Error('No audio data received (WebSocket closed early)'));
            }
        });

        // Timeout
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
                reject(new Error("Synthesis Timeout"));
            }
        }, 15000);
    });
}

async function run() {
    console.log("--- 🕵️ Diagnostic: Raw Edge-TTS (Neural) ---");
    try {
        // Test English (Realistic)
        const enVoice = 'en-US-AriaNeural';
        console.log(`Testing English: ${enVoice}`);
        const enAudio = await synthesize("This is a highly realistic neural voice test from Edge cloud.", enVoice);
        fs.writeFileSync("test-en-realistic.mp3", enAudio);
        console.log(`✅ English Success! (${enAudio.length} bytes)`);

        // Test Hindi (Realistic)
        const hiVoice = 'hi-IN-MadhurNeural';
        console.log(`Testing Hindi: ${hiVoice}`);
        const hiAudio = await synthesize("नमस्ते, यह एक प्राकृतिक हिंदी आवाज़ है जो बिल्कुल इंसानों जैसी लगती है।", hiVoice);
        fs.writeFileSync("test-hi-realistic.mp3", hiAudio);
        console.log(`✅ Hindi Success! (${hiAudio.length} bytes)`);

    } catch (e) {
        console.error("❌ CRITICAL ERROR:", e.message);
    }
}

run();
