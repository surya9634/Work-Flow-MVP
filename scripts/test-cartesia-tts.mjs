/**
 * Quick smoke test for Cartesia TTS integration.
 * Run: node scripts/test-cartesia-tts.mjs
 *
 * Make sure CARTESIA_API_KEY is set in your .env file first.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load .env manually (no dotenv dep needed)
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = val;
}

const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
if (!CARTESIA_API_KEY || CARTESIA_API_KEY === "your_cartesia_api_key_here") {
    console.error("❌  CARTESIA_API_KEY is not set. Add it to your .env file.");
    process.exit(1);
}

const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"; // Barbra – professional female

console.log("🎙️  Testing Cartesia TTS...");
console.log(`   Voice: ${DEFAULT_VOICE_ID}`);
console.log(`   Text:  "Hello! Cartesia TTS is working perfectly."`);

const response = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": CARTESIA_API_KEY,
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        model_id: "sonic-2",
        transcript: "Hello! Cartesia TTS is working perfectly.",
        voice: { mode: "id", id: DEFAULT_VOICE_ID },
        output_format: { container: "mp3", encoding: "mp3", sample_rate: 44100 },
        language: "en",
    }),
});

if (!response.ok) {
    const errText = await response.text();
    console.error(`❌  Cartesia API error ${response.status}: ${errText}`);
    process.exit(1);
}

const arrayBuffer = await response.arrayBuffer();
const audioBuffer = Buffer.from(arrayBuffer);

const outPath = path.resolve(process.cwd(), "logs", "cartesia-test.mp3");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, audioBuffer);

console.log(`✅  Success! Audio saved to: ${outPath}`);
console.log(`   File size: ${audioBuffer.length} bytes`);
