const tts = require("@travisvn/edge-tts");
const fs = require("fs");

async function test() {
    console.log("--- 🚀 Testing @travisvn/edge-tts with 'Communicate' ---");
    try {
        // Many Edge-TTS libraries use the 'Communicate' class
        const voice = "en-US-ChristopherNeural";
        const text = "This is a natural neural voice test. I should sound human and professional.";

        console.log(`Step 1: Instantiating Communicate for voice: ${voice}`);
        const communicate = new tts.Communicate(text, voice);

        console.log("Step 2: Generating audio stream...");
        // In this library, Communicate.stream() often returns chunks
        let audioData = Buffer.alloc(0);

        // Let's check if it has a stream method
        if (typeof communicate.stream === 'function') {
            for await (const chunk of communicate.stream()) {
                if (chunk.type === 'audio') {
                    audioData = Buffer.concat([audioData, chunk.data]);
                }
            }
        } else {
            console.log("Communicate doesn't have a .stream() method. Checking keys:", Object.keys(communicate));
            // Try different library specific method
        }

        if (audioData.length > 0) {
            fs.writeFileSync("test_natural_travisvn.mp3", audioData);
            console.log(`✅ SUCCESS! Saved ${audioData.length} bytes to test_natural_travisvn.mp3`);
        } else {
            console.log("❌ Failed to generate audio data.");
        }
    } catch (e) {
        console.error("❌ Error:", e.message);
        console.error(e.stack);
    }
}

test();
