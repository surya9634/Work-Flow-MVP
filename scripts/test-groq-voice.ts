import Groq from "groq-sdk";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.error("GROQ_API_KEY not found in .env");
    process.exit(1);
}

const groq = new Groq({ apiKey });

async function test() {
    const models = ["aura-asteria-en", "aura-leo-en", "tts-1", "playai-tts", "canopylabs/orpheus-v1-english"];
    let results = "";

    for (const v of models) {
        results += `\n--- Testing model: ${v} ---\n`;
        try {
            const shortName = v.includes("aura") ? v.split("-")[1] : "asteria";
            results += `Trying with voice parameter: ${shortName}\n`;
            const response = await groq.audio.speech.create({
                model: v,
                voice: shortName as any,
                input: "Hi, I am testing the voice personality for my AI agent.",
            });
            results += `✅ Success for model ${v} with voice ${shortName}\n`;
        } catch (e: any) {
            results += `❌ Failed for model ${v}: ${e.message}\n`;
            if (e.response && e.response.data) {
                results += `Detail: ${JSON.stringify(e.response.data)}\n`;
            }
        }
    }
    fs.writeFileSync("groq_tts_test_results.txt", results);
    console.log("Results written to groq_tts_test_results.txt");
}

test();
