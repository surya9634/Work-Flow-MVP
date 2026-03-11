const { EdgeTTS } = require("edge-tts-node");
const fs = require("fs");

async function test() {
    console.log("Starting Edge-TTS node test...");
    try {
        const tts = new EdgeTTS();
        const buffer = await tts.getAudioBuffer("Hello world", "en-US-AriaNeural");
        fs.writeFileSync("test.mp3", buffer);
        console.log("Success!");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
