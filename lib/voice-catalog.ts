/**
 * Cartesia Voice Catalog
 * All voice IDs fetched directly from the Cartesia API.
 * Browse voices at: https://play.cartesia.ai
 */

export type VoiceOption = {
    id: string
    name: string
    shortName: string
    gender: "female" | "male"
    category: "English" | "Hindi" | "Indian English"
    description: string
}

export const VOICE_CATALOG: VoiceOption[] = [
    // ─── English ──────────────────────────────────────────────────────────────
    {
        id: "a7a59115-2425-4192-844c-1e98ec7d6877",
        name: "Amber",
        shortName: "Amber - Warm Support",
        gender: "female",
        category: "English",
        description: "Warm & professional",
    },
    {
        id: "043cfc81-d69f-4bee-ae1e-7862cb358650",
        name: "Amelia",
        shortName: "Amelia - Instructor",
        gender: "female",
        category: "English",
        description: "Clear & authoritative",
    },
    {
        id: "ec1e269e-9ca0-402f-8a18-58e0e022355a",
        name: "Ariana",
        shortName: "Ariana - Kind Friend",
        gender: "female",
        category: "English",
        description: "Friendly & kind",
    },
    {
        id: "00a77add-48d5-4ef6-8157-71e5437b282d",
        name: "Callie",
        shortName: "Callie - Encourager",
        gender: "female",
        category: "English",
        description: "Upbeat & encouraging",
    },
    {
        id: "55deba52-bc73-4481-ab69-9c8831c8a7c3",
        name: "Camille",
        shortName: "Camille - Friendly Expert",
        gender: "female",
        category: "English",
        description: "Confident & friendly",
    },
    {
        id: "607167f6-9bf2-473c-accc-ac7b3b66b30b",
        name: "Brenda",
        shortName: "Brenda - Host",
        gender: "female",
        category: "English",
        description: "Polished presenter",
    },
    {
        id: "a0e99841-438c-4a64-b679-ae501e7d6091",
        name: "Barbra",
        shortName: "Barbra - Professional",
        gender: "female",
        category: "English",
        description: "Professional & warm",
    },
    {
        id: "bbee10a8-4f08-4c5c-8282-e69299115055",
        name: "Ben",
        shortName: "Ben - Helpful Man",
        gender: "male",
        category: "English",
        description: "Calm & helpful",
    },
    {
        id: "a167e0f3-df7e-4d52-a9c3-f949145efdab",
        name: "Blake",
        shortName: "Blake - Helpful Agent",
        gender: "male",
        category: "English",
        description: "Professional agent",
    },
    {
        id: "5cad89c9-d88a-4832-89fb-55f2f16d13d3",
        name: "Brandon",
        shortName: "Brandon - Confident",
        gender: "male",
        category: "English",
        description: "Confident & clear",
    },
    {
        id: "c45bc1d0-c817-4b9c-be6e-3a04e5bdfd44",
        name: "Callum",
        shortName: "Callum - Brand Voice",
        gender: "male",
        category: "English",
        description: "Brand spokesperson",
    },
    {
        id: "df872fcd-da17-4b01-a49f-a80d7aaee95e",
        name: "Cameron",
        shortName: "Cameron - Chill",
        gender: "male",
        category: "English",
        description: "Relaxed & casual",
    },

    // ─── Hindi ────────────────────────────────────────────────────────────────
    {
        id: "47f3bbb1-e98f-4e0c-92c5-5f0325e1e206",
        name: "Neha",
        shortName: "Neha - Virtual Assistant",
        gender: "female",
        category: "Hindi",
        description: "Virtual assistant",
    },
    {
        id: "9cebb910-d4b7-4a4a-85a4-12c79137724c",
        name: "Aarti",
        shortName: "Aarti - Conversationalist",
        gender: "female",
        category: "Hindi",
        description: "Conversational",
    },
    {
        id: "56e35e2d-6eb6-4226-ab8b-9776515a7094",
        name: "Kavita",
        shortName: "Kavita - Customer Care",
        gender: "female",
        category: "Hindi",
        description: "Customer care",
    },
    {
        id: "bec003e2-3cb3-429c-8468-206a393c67ad",
        name: "Parvati",
        shortName: "Parvati - Friendly",
        gender: "female",
        category: "Hindi",
        description: "Friendly & warm",
    },
    {
        id: "f91ab3e6-5071-4e15-b016-cde6f2bcd222",
        name: "Aadhya",
        shortName: "Aadhya - Soother",
        gender: "female",
        category: "Hindi",
        description: "Calm & soothing",
    },
    {
        id: "28ca2041-5dda-42df-8123-f58ea9c3da00",
        name: "Palak",
        shortName: "Palak - Presenter",
        gender: "female",
        category: "Hindi",
        description: "Clear presenter",
    },
    {
        id: "faf0731e-dfb9-4cfc-8119-259a79b27e12",
        name: "Riya",
        shortName: "Riya - Collège Roommate",
        gender: "female",
        category: "Hindi",
        description: "Casual & young",
    },
    {
        id: "209d9a43-03eb-40d8-a7b7-51a6d54c052f",
        name: "Anita",
        shortName: "Anita - Meditation Guide",
        gender: "female",
        category: "Hindi",
        description: "Soft & meditative",
    },
    {
        id: "20e68f5c-08e5-42d0-8e9b-6e716fd1ae66",
        name: "Vivek",
        shortName: "Vivek - Composed",
        gender: "male",
        category: "Hindi",
        description: "Composed voice",
    },
    {
        id: "55e2a153-c61e-4784-85c8-e954cb22fe29",
        name: "Sanjay",
        shortName: "Sanjay - Clear Speaker",
        gender: "male",
        category: "Hindi",
        description: "Clear & direct",
    },
    {
        id: "7e8cb11d-37af-476b-ab8f-25da99b18644",
        name: "Anuj",
        shortName: "Anuj - Engaging Narrator",
        gender: "male",
        category: "Hindi",
        description: "Engaging narrator",
    },
    {
        id: "393dd459-f8d8-4c3e-a86b-ec43a1113d0b",
        name: "Rahul",
        shortName: "Rahul - Calm Office Guy",
        gender: "male",
        category: "Hindi",
        description: "Calm & professional",
    },
    {
        id: "791d5162-d5eb-40f0-8189-f19db44611d8",
        name: "Ayush",
        shortName: "Ayush - Friendly Neighbor",
        gender: "male",
        category: "Hindi",
        description: "Friendly neighbor",
    },
    {
        id: "6303e5fb-a0a7-48f9-bb1a-dd42c216dc5d",
        name: "Sagar",
        shortName: "Sagar - Helpful Friend",
        gender: "male",
        category: "Hindi",
        description: "Helpful & friendly",
    },
    {
        id: "be79f378-47fe-4f9c-b92b-f02cefa62ccf",
        name: "Sunil",
        shortName: "Sunil - Official Announcer",
        gender: "male",
        category: "Hindi",
        description: "Authoritative",
    },
    {
        id: "bdab08ad-4137-4548-b9db-6142854c7525",
        name: "Imran",
        shortName: "Imran - Film Actor",
        gender: "male",
        category: "Hindi",
        description: "Dramatic & rich",
    },

    // ─── Indian English (Hinglish) ─────────────────────────────────────────────
    {
        id: "95d51f79-c397-46f9-b49a-23763d3eaa2d",
        name: "Arushi",
        shortName: "Arushi - Hinglish Speaker",
        gender: "female",
        category: "Indian English",
        description: "Hinglish, young & modern",
    },
    {
        id: "39d518b7-fd0b-4676-9b8b-29d64ff31e12",
        name: "Aarav",
        shortName: "Aarav - Storyteller",
        gender: "male",
        category: "Indian English",
        description: "Indian English storyteller",
    },
]

export const VOICE_CATEGORIES = ["English", "Hindi", "Indian English"] as const
export type VoiceCategory = typeof VOICE_CATEGORIES[number]

export const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091" // Barbra
