const { EdgeTTS } = require("@lixen/edge-tts");
const fs = require("fs");

async function test() {
    console.log("--- 🚀 Testing @lixen/edge-tts for Neural Quality ---");
    try {
        const tts = new EdgeTTS();
        const voice = "en-US-ChristopherNeural"; // High quality male
        const text = "Hello, I am a natural neural voice from the edge cloud. I am not robotic.";

        console.log(`Step 1: Generating neural audio for: ${voice}`);
        const buffer = await tts.audio(text, { voice });

        if (buffer && buffer.length > 0) {
            fs.writeFileSync("test_lixen_natural.mp3", buffer);
            console.log(`✅ SUCCESS! Saved ${buffer.length} bytes to test_lixen_natural.mp3`);
        } else {
            console.log("❌ Error: Buffer is empty.");
        }
    } catch (e) {
        console.error("❌ Critical Error:", e.message);
        console.error(e.stack);
    }
}

test();
