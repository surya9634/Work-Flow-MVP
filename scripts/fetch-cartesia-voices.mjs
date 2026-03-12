/**
 * Fetches all available Cartesia voices and prints them grouped by language.
 * Run: node scripts/fetch-cartesia-voices.mjs
 */
import fs from "fs";
import path from "path";

// Load .env manually
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
    console.error("❌  CARTESIA_API_KEY is not set.");
    process.exit(1);
}

console.log("🔍 Fetching all Cartesia voices...\n");

const res = await fetch("https://api.cartesia.ai/voices", {
    headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": CARTESIA_API_KEY,
    },
});

if (!res.ok) {
    console.error("API error:", res.status, await res.text());
    process.exit(1);
}

const data = await res.json();
// voices can be an array or { voices: [...] }
const voices = Array.isArray(data) ? data : (data.voices || data.data || []);

// Group by language
const groups = {};
for (const v of voices) {
    const lang = v.language || "unknown";
    if (!groups[lang]) groups[lang] = [];
    groups[lang].push(v);
}

for (const [lang, vlist] of Object.entries(groups)) {
    console.log(`\n=== ${lang} ===`);
    for (const v of vlist) {
        console.log(`  ID: "${v.id}"  Name: "${v.name}"  Gender: ${v.gender ?? "?"}`);
    }
}

// Save full JSON for reference
fs.writeFileSync("logs/cartesia-voices.json", JSON.stringify(voices, null, 2));
console.log(`\n✅  Full list saved to logs/cartesia-voices.json`);
