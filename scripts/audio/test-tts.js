const { MsEdgeTTS, OUTPUT_FORMAT } = require("edge-tts-node");
const fs = require("fs");
const path = require("path");

(async () => {
    try {
        console.log("Initializing TTS...");
        const tts = new MsEdgeTTS({ enableLogger: true });

        console.log("Setting metadata...");
        await tts.setMetadata(
            "en-US-AriaNeural",
            OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
        );

        console.log("Generating audio...");
        const outputPath = path.join(__dirname, "test-audio.webm");
        await tts.toFile(outputPath, "Hello, this is a test of the Microsoft Edge TTS system.");

        console.log(`Success! Audio saved to ${outputPath}`);
        console.log("File size:", fs.statSync(outputPath).size, "bytes");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
})();
