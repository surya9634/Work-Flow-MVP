const { EdgeTTS } = require("@travisvn/edge-tts");
const fs = require("fs");

async function test() {
    console.log("--- 🏁 Starting TravisVN Edge-TTS Test ---");
    try {
        const tts = new EdgeTTS();
        const voice = "en-US-ChristopherNeural";
        console.log(`Step 1: Preparing to generate voice: ${voice}`);

        // Let's try the more direct method if available
        const text = "Hi, I am your natural AI agent. My voice should sound human-like and professional.";
        console.log(`Step 2: Sending request for text: "${text}"`);

        await tts.ttsPromise(text, "test_final.mp3", {
            voice: voice,
            rate: "-10%",
            pitch: "+0Hz"
        });

        console.log("Step 3: Verification...");
        if (fs.existsSync("test_final.mp3")) {
            const stats = fs.statSync("test_final.mp3");
            console.log(`✅ SUCCESS! File created: test_final.mp3 (${stats.size} bytes)`);
        } else {
            console.error("❌ ERROR: File was not created despite promise resolving.");
        }
    } catch (e) {
        console.error("❌ CRITICAL ERROR:", e);
        if (e.stack) console.error(e.stack);
    }
}

test();
