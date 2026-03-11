const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * DEFINITIVE REALISTIC TTS ENGINE
 * Uses the stable Python edge-tts library to generate human-grade speech.
 */
async function synthesizeWithPython(text, voice = 'en-US-AriaNeural', outputFile = 'output.mp3') {
    return new Promise((resolve, reject) => {
        const absPath = path.resolve(outputFile);
        const edgeTtsPath = 'C:\\Users\\ssrss\\AppData\\Roaming\\Python\\Python313\\Scripts\\edge-tts.exe';
        console.log(`[PythonTTS] Synthesizing: "${text.slice(0, 30)}..." with ${voice}`);

        // Command: edge-tts --text "TEXT" --voice VOICE --write-media FILE
        const child = spawn(edgeTtsPath, [
            '--text', text,
            '--voice', voice,
            '--write-media', absPath
        ]);

        child.stdout.on('data', (data) => console.log(`[PythonTTS Out]: ${data}`));
        child.stderr.on('data', (data) => console.error(`[PythonTTS Err]: ${data}`));

        child.on('close', (code) => {
            if (code === 0 && fs.existsSync(absPath)) {
                const stats = fs.statSync(absPath);
                console.log(`✅ Success! Audio saved to ${absPath} (${stats.size} bytes)`);
                resolve(absPath);
            } else {
                reject(new Error(`edge-tts failed with code ${code}`));
            }
        });
    });
}

// DIAGNOSTIC RUN
async function runDiagnostic() {
    console.log("--- 🕵️ Diagnostic: Stable Python edge-tts ---");
    try {
        // 1. Test English Neural (Aria)
        await synthesizeWithPython(
            "Hi, this is Aria. I'm choosing a high-quality cloud voice to ensure your agent sounds natural and human.",
            "en-US-AriaNeural",
            "diag-en-neural.mp3"
        );

        // 2. Test Hindi Neural (Madhur)
        await synthesizeWithPython(
            "नमस्ते, मैं आपका एआई सेल्स एजेंट हूं। क्या मैं आपकी मदद कर सकता हूं?",
            "hi-IN-MadhurNeural",
            "diag-hi-neural.mp3"
        );

        console.log("\nFinal results check:");
        if (fs.existsSync("diag-en-neural.mp3")) console.log("✓ diag-en-neural.mp3 exists");
        if (fs.existsSync("diag-hi-neural.mp3")) console.log("✓ diag-hi-neural.mp3 exists");

    } catch (e) {
        console.error("❌ Diagnostic Failure:", e.message);
    }
}

runDiagnostic();
