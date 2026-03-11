const googleTTS = require("google-tts-api");
const fs = require("fs");
const path = require("path");
const https = require("https");

(async () => {
    try {
        console.log("Generating URL...");
        const url = googleTTS.getAudioUrl("Hello world", {
            lang: "en",
            slow: false,
            host: "https://translate.google.com",
        });
        console.log("Audio URL:", url);

        console.log("Downloading audio...");
        const outputPath = path.join(__dirname, "test-google.mp3");
        const file = fs.createWriteStream(outputPath);

        https.get(url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                console.log(`Success! Audio saved to ${outputPath}`);
                console.log("File size:", fs.statSync(outputPath).size, "bytes");
            });
        }).on("error", (err) => {
            console.error("Error downloading:", err.message);
        });

    } catch (e) {
        console.error("Error:", e);
    }
})();
