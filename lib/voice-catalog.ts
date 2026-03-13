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
    { id: "meera-hi",    name: "Meera",    shortName: "Meera - Hindi",     gender: "female", category: "Hindi",     description: "Warm & natural" },
    { id: "pavithra-hi", name: "Pavithra", shortName: "Pavithra - Hindi",  gender: "female", category: "Hindi",     description: "Clear & professional" },
    { id: "maitreyi-hi", name: "Maitreyi", shortName: "Maitreyi - Hindi", gender: "female", category: "Hindi",     description: "Friendly & expressive" },
    { id: "arvind-hi",   name: "Arvind",   shortName: "Arvind - Hindi",    gender: "male",   category: "Hindi",     description: "Professional & calm" },
    { id: "amol-hi",     name: "Amol",     shortName: "Amol - Hindi",      gender: "male",   category: "Hindi",     description: "Friendly & approachable" },
    { id: "amartya-hi",  name: "Amartya",  shortName: "Amartya - Hindi",   gender: "male",   category: "Hindi",     description: "Deep & authoritative" },

    // ─── Tamil ────────────────────────────────────────────────────────────────
    { id: "meera-ta",    name: "Meera",    shortName: "Meera - Tamil",     gender: "female", category: "Tamil",     description: "Warm & natural" },
    { id: "maitreyi-ta", name: "Maitreyi", shortName: "Maitreyi - Tamil", gender: "female", category: "Tamil",     description: "Friendly & expressive" },
    { id: "arvind-ta",   name: "Arvind",   shortName: "Arvind - Tamil",    gender: "male",   category: "Tamil",     description: "Clear & confident" },
    { id: "amol-ta",     name: "Amol",     shortName: "Amol - Tamil",      gender: "male",   category: "Tamil",     description: "Warm & friendly" },

    // ─── Telugu ───────────────────────────────────────────────────────────────
    { id: "meera-te",    name: "Meera",    shortName: "Meera - Telugu",    gender: "female", category: "Telugu",    description: "Warm & natural" },
    { id: "pavithra-te", name: "Pavithra", shortName: "Pavithra - Telugu", gender: "female", category: "Telugu",    description: "Professional" },
    { id: "arvind-te",   name: "Arvind",   shortName: "Arvind - Telugu",   gender: "male",   category: "Telugu",    description: "Clear & confident" },
    { id: "amartya-te",  name: "Amartya",  shortName: "Amartya - Telugu",  gender: "male",   category: "Telugu",    description: "Deep & rich" },

    // ─── Kannada ──────────────────────────────────────────────────────────────
    { id: "pavithra-kn", name: "Pavithra", shortName: "Pavithra - Kannada", gender: "female", category: "Kannada",  description: "Professional" },
    { id: "maitreyi-kn", name: "Maitreyi", shortName: "Maitreyi - Kannada", gender: "female", category: "Kannada",  description: "Expressive & warm" },
    { id: "arvind-kn",   name: "Arvind",   shortName: "Arvind - Kannada",   gender: "male",   category: "Kannada",  description: "Confident" },
    { id: "amol-kn",     name: "Amol",     shortName: "Amol - Kannada",     gender: "male",   category: "Kannada",  description: "Friendly" },

    // ─── Malayalam ────────────────────────────────────────────────────────────
    { id: "meera-ml",    name: "Meera",    shortName: "Meera - Malayalam",    gender: "female", category: "Malayalam", description: "Natural & warm" },
    { id: "pavithra-ml", name: "Pavithra", shortName: "Pavithra - Malayalam", gender: "female", category: "Malayalam", description: "Professional" },
    { id: "amartya-ml",  name: "Amartya",  shortName: "Amartya - Malayalam",  gender: "male",   category: "Malayalam", description: "Deep & clear" },

    // ─── Bengali ──────────────────────────────────────────────────────────────
    { id: "meera-bn",    name: "Meera",    shortName: "Meera - Bengali",    gender: "female", category: "Bengali",   description: "Warm & natural" },
    { id: "pavithra-bn", name: "Pavithra", shortName: "Pavithra - Bengali", gender: "female", category: "Bengali",   description: "Professional" },
    { id: "arvind-bn",   name: "Arvind",   shortName: "Arvind - Bengali",   gender: "male",   category: "Bengali",   description: "Confident" },
    { id: "amartya-bn",  name: "Amartya",  shortName: "Amartya - Bengali",  gender: "male",   category: "Bengali",   description: "Deep & authoritative" },

    // ─── Marathi ──────────────────────────────────────────────────────────────
    { id: "maitreyi-mr", name: "Maitreyi", shortName: "Maitreyi - Marathi", gender: "female", category: "Marathi",   description: "Friendly" },
    { id: "meera-mr",    name: "Meera",    shortName: "Meera - Marathi",    gender: "female", category: "Marathi",   description: "Warm & clear" },
    { id: "amol-mr",     name: "Amol",     shortName: "Amol - Marathi",     gender: "male",   category: "Marathi",   description: "Friendly" },
    { id: "arvind-mr",   name: "Arvind",   shortName: "Arvind - Marathi",   gender: "male",   category: "Marathi",   description: "Professional" },

    // ─── Gujarati ─────────────────────────────────────────────────────────────
    { id: "meera-gu",    name: "Meera",    shortName: "Meera - Gujarati",    gender: "female", category: "Gujarati",  description: "Warm & natural" },
    { id: "maitreyi-gu", name: "Maitreyi", shortName: "Maitreyi - Gujarati", gender: "female", category: "Gujarati",  description: "Expressive" },
    { id: "amol-gu",     name: "Amol",     shortName: "Amol - Gujarati",     gender: "male",   category: "Gujarati",  description: "Friendly" },

    // ─── Punjabi ──────────────────────────────────────────────────────────────
    { id: "meera-pa",    name: "Meera",    shortName: "Meera - Punjabi",    gender: "female", category: "Punjabi",   description: "Warm & energetic" },
    { id: "pavithra-pa", name: "Pavithra", shortName: "Pavithra - Punjabi", gender: "female", category: "Punjabi",   description: "Professional" },
    { id: "amol-pa",     name: "Amol",     shortName: "Amol - Punjabi",     gender: "male",   category: "Punjabi",   description: "Bold & friendly" },

    // ─── Odia ─────────────────────────────────────────────────────────────────
    { id: "meera-od",    name: "Meera",    shortName: "Meera - Odia",    gender: "female", category: "Odia",      description: "Warm & clear" },
    { id: "amartya-od",  name: "Amartya",  shortName: "Amartya - Odia",  gender: "male",   category: "Odia",      description: "Deep & calm" },

    // ─── English (Indian English via Sarvam) ──────────────────────────────────
    { id: "meera-en",    name: "Meera",    shortName: "Meera - English",    gender: "female", category: "English",   description: "Indian English, warm" },
    { id: "pavithra-en", name: "Pavithra", shortName: "Pavithra - English", gender: "female", category: "English",   description: "Professional" },
    { id: "maitreyi-en", name: "Maitreyi", shortName: "Maitreyi - English", gender: "female", category: "English",   description: "Friendly & expressive" },
    { id: "arvind-en",   name: "Arvind",   shortName: "Arvind - English",   gender: "male",   category: "English",   description: "Confident Indian English" },
    { id: "amol-en",     name: "Amol",     shortName: "Amol - English",     gender: "male",   category: "English",   description: "Approachable" },
    { id: "amartya-en",  name: "Amartya",  shortName: "Amartya - English",  gender: "male",   category: "English",   description: "Deep & rich" },
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

export const DEFAULT_VOICE_ID = "meera-hi"
