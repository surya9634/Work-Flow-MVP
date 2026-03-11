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

async function main() {
    try {
        const list = await groq.models.list();
        const models = list.data.map(m => m.id);
        fs.writeFileSync("groq_models_list.json", JSON.stringify(models, null, 2));
        console.log("Models list written to groq_models_list.json");
    } catch (e: any) {
        console.error("Failed to list models:", e.message);
    }
}

main();
