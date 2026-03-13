/**
 * Sarvam AI Voice Catalog
 * All voices powered by Sarvam's Bulbul:v1 model.
 * 40+ voices across 11 Indian languages.
 */

export type VoiceOption = {
    id: string          // Sarvam compound ID e.g. "meera-hi"
    name: string
    shortName: string
    gender: "female" | "male"
    category: VoiceCategory
    description: string
}

export const VOICE_CATALOG: VoiceOption[] = [
    // ─── Hindi ────────────────────────────────────────────────────────────────
    // { id: "anushka-hi",  name: "Anushka",  shortName: "Anushka - Hindi",  gender: "female", category: "Hindi", description: "Clear & professional (Hindi)" },
    // { id: "abhilash-hi", name: "Abhilash", shortName: "Abhilash - Hindi", gender: "male",   category: "Hindi", description: "Confident & formal (Hindi)" },
    { id: "priya-hi",    name: "Priya",    shortName: "Priya - Hindi",    gender: "female", category: "Hindi", description: "Warm & friendly (Hindi)" },
    { id: "rahul-hi",    name: "Rahul",    shortName: "Rahul - Hindi",    gender: "male",   category: "Hindi", description: "Approachable (Hindi)" },
    { id: "neha-hi",     name: "Neha",     shortName: "Neha - Hindi",     gender: "female", category: "Hindi", description: "Expressive (Hindi)" },
    { id: "rohan-hi",    name: "Rohan",    shortName: "Rohan - Hindi",    gender: "male",   category: "Hindi", description: "Energetic (Hindi)" },

    // ─── Bengali ──────────────────────────────────────────────────────────────
    // { id: "manisha-bn",  name: "Manisha",  shortName: "Manisha - Bengali", gender: "female", category: "Bengali", description: "Professional (Bengali)" },
    { id: "amit-bn",     name: "Amit",     shortName: "Amit - Bengali",    gender: "male",   category: "Bengali", description: "Clear (Bengali)" },
    { id: "shreya-bn",   name: "Shreya",   shortName: "Shreya - Bengali",  gender: "female", category: "Bengali", description: "Warm (Bengali)" },
    { id: "dev-bn",      name: "Dev",      shortName: "Dev - Bengali",     gender: "male",   category: "Bengali", description: "Confident (Bengali)" },

    // ─── Gujarati ─────────────────────────────────────────────────────────────
    { id: "vidya-gu",    name: "Vidya",    shortName: "Vidya - Gujarati",  gender: "female", category: "Gujarati", description: "Professional (Gujarati)" },
    { id: "varun-gu",    name: "Varun",    shortName: "Varun - Gujarati",  gender: "male",   category: "Gujarati", description: "Clear (Gujarati)" },
    { id: "pooja-gu",    name: "Pooja",    shortName: "Pooja - Gujarati",  gender: "female", category: "Gujarati", description: "Warm (Gujarati)" },

    // ─── Kannada ──────────────────────────────────────────────────────────────
    { id: "arya-kn",     name: "Arya",     shortName: "Arya - Kannada",    gender: "female", category: "Kannada", description: "Professional (Kannada)" },
    { id: "manan-kn",    name: "Manan",    shortName: "Manan - Kannada",   gender: "male",   category: "Kannada", description: "Clear (Kannada)" },
    { id: "simran-kn",   name: "Simran",   shortName: "Simran - Kannada",  gender: "female", category: "Kannada", description: "Warm (Kannada)" },
    { id: "sumit-kn",    name: "Sumit",    shortName: "Sumit - Kannada",   gender: "male",   category: "Kannada", description: "Confident (Kannada)" },

    // ─── Malayalam ────────────────────────────────────────────────────────────
    { id: "kavya-ml",    name: "Kavya",    shortName: "Kavya - Malayalam", gender: "female", category: "Malayalam", description: "Professional (Malayalam)" },
    { id: "hitesh-ml",   name: "Hitesh",   shortName: "Hitesh - Malayalam", gender: "male",  category: "Malayalam", description: "Clear (Malayalam)" },
    { id: "roopa-ml",    name: "Roopa",    shortName: "Roopa - Malayalam",  gender: "female", category: "Malayalam", description: "Warm (Malayalam)" },

    // ─── Marathi ──────────────────────────────────────────────────────────────
    { id: "ishita-mr",   name: "Ishita",   shortName: "Ishita - Marathi",  gender: "female", category: "Marathi", description: "Professional (Marathi)" },
    { id: "kabir-mr",    name: "Kabir",    shortName: "Kabir - Marathi",   gender: "male",   category: "Marathi", description: "Clear (Marathi)" },
    { id: "ritu-mr",     name: "Ritu",     shortName: "Ritu - Marathi",    gender: "female", category: "Marathi", description: "Warm (Marathi)" },
    { id: "aayan-mr",    name: "Aayan",    shortName: "Aayan - Marathi",   gender: "male",   category: "Marathi", description: "Confident (Marathi)" },

    // ─── Odia ─────────────────────────────────────────────────────────────────
    { id: "amelia-od",   name: "Amelia",   shortName: "Amelia - Odia",     gender: "female", category: "Odia", description: "Professional (Odia)" },
    { id: "aditya-od",   name: "Aditya",   shortName: "Aditya - Odia",     gender: "male",   category: "Odia", description: "Clear (Odia)" },

    // ─── Punjabi ──────────────────────────────────────────────────────────────
    { id: "sophia-pa",   name: "Sophia",   shortName: "Sophia - Punjabi",  gender: "female", category: "Punjabi", description: "Professional (Punjabi)" },
    { id: "anand-pa",    name: "Anand",    shortName: "Anand - Punjabi",   gender: "male",   category: "Punjabi", description: "Clear (Punjabi)" },
    { id: "tanya-pa",    name: "Tanya",    shortName: "Tanya - Punjabi",   gender: "female", category: "Punjabi", description: "Warm (Punjabi)" },

    // ─── Tamil ────────────────────────────────────────────────────────────────
    { id: "shruti-ta",   name: "Shruti",   shortName: "Shruti - Tamil",    gender: "female", category: "Tamil", description: "Professional (Tamil)" },
    { id: "tarun-ta",    name: "Tarun",    shortName: "Tarun - Tamil",     gender: "male",   category: "Tamil", description: "Clear (Tamil)" },
    { id: "suhani-ta",   name: "Suhani",   shortName: "Suhani - Tamil",    gender: "female", category: "Tamil", description: "Warm (Tamil)" },
    { id: "sunny-ta",    name: "Sunny",    shortName: "Sunny - Tamil",     gender: "male",   category: "Tamil", description: "Confident (Tamil)" },

    // ─── Telugu ───────────────────────────────────────────────────────────────
    { id: "kavitha-te",  name: "Kavitha",  shortName: "Kavitha - Telugu",  gender: "female", category: "Telugu", description: "Professional (Telugu)" },
    { id: "mani-te",     name: "Mani",     shortName: "Mani - Telugu",     gender: "male",   category: "Telugu", description: "Clear (Telugu)" },
    { id: "rupali-te",   name: "Rupali",   shortName: "Rupali - Telugu",   gender: "female", category: "Telugu", description: "Warm (Telugu)" },
    { id: "gokul-te",    name: "Gokul",    shortName: "Gokul - Telugu",    gender: "male",   category: "Telugu", description: "Confident (Telugu)" },

    // ─── English (Indian English) ─────────────────────────────────────────────
    // { id: "anushka-en",  name: "Anushka",  shortName: "Anushka - English", gender: "female", category: "English", description: "Indian English, Female" },
    // { id: "abhilash-en", name: "Abhilash", shortName: "Abhilash - English",gender: "male",   category: "English", description: "Indian English, Male" },
    { id: "priya-en",    name: "Priya",    shortName: "Priya - English",   gender: "female", category: "English", description: "Indian English, Warm" },
    { id: "rahul-en",    name: "Rahul",    shortName: "Rahul - English",   gender: "male",   category: "English", description: "Indian English, Clear" },
]

export const VOICE_CATEGORIES = [
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Bengali",
    "Marathi",
    "Gujarati",
    "Punjabi",
    "Odia",
] as const

export type VoiceCategory = typeof VOICE_CATEGORIES[number]

export const DEFAULT_VOICE_ID = "priya-hi"
