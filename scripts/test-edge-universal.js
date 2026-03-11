const { EdgeTTS } = require("edge-tts-universal");
const fs = require("fs");

async function test() {
    console.log("Starting Edge-TTS Universal test...");
    try {
        const tts = new EdgeTTS();
        // Use a known natural male voice
        const voice = "en-US-ChristopherNeural";
        console.log(`Generating speech with voice: ${voice}...`);

        const response = await tts.getAudioResponse("Hi, I'm your AI sales agent. This voice should sound natural and human-like.", voice);

        // The response might be a buffer or a stream depending on the library
        // Based on typical edge-tts libraries, it might return a buffer
        fs.writeFileSync("test_natural.mp3", response);
        console.log("✅ Success! Audio saved to test_natural.mp3. Size:", response.length);
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

test();
