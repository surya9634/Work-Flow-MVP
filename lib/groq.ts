import { Groq } from "groq-sdk";
import dotenv from "dotenv";

// Ensure environment variables are loaded immediately for the Groq singleton
dotenv.config();

const apiKey = process.env.GROQ_API_KEY || "";

if (!apiKey) {
    console.warn("GROQ_API_KEY is missing in environment variables.");
}

export const groq = new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Only for dev debugging if needed, usually false
});
