const { EdgeTTS } = require("@lixen/edge-tts");
const fs = require("fs");

async function test() {
    console.log("--- 🕵️ Deep Diagnostic: @lixen/edge-tts ---");
    try {
        const tts = new EdgeTTS();
        const voice = "en-US-ChristopherNeural";
        const text = "Hi, I am your natural AI agent. I am testing the neural engine for human-like quality.";

        console.log(`[1/3] Calling tts.audio for ${voice}...`);
        const buffer = await tts.audio(text, { voice });

        console.log(`[2/3] Buffer received. Length: ${buffer ? buffer.length : 0} bytes`);

        if (buffer && buffer.length > 300) { // Tiny files are usually errors/headers
            const path = "./lixen_final_test.mp3";
            fs.writeFileSync(path, buffer);
            console.log(`[3/3] ✅ SUCCESS! File written to ${path}`);

            // Final verify
            if (fs.existsSync(path)) {
                console.log(`--- VERIFIED: ${path} exists and is ${fs.statSync(path).size} bytes ---`);
            }
        } else {
            console.log("❌ FAILED: Buffer is null, empty, or too small to be audio.");
        }
    } catch (e) {
        console.error("❌ CRITICAL EXCEPTION:", e.message);
        if (e.stack) console.error(e.stack);
    }
}

test();
