import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * GET /api/twilio/audio/[filename]
 * Serves temporary audio files (TTS output) generated for Twilio to play over the phone.
 * Required because Next.js public/ folder can sometimes fail or aggressively cache new dynamic files.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        
        // Prevent directory traversal
        if (filename.includes("..") || filename.includes("/")) {
             return new NextResponse("Invalid filename", { status: 400 });
        }

        const filePath = path.join(process.cwd(), "public", "temp-audio", filename);
        
        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": filename.endsWith(".mp3") ? "audio/mpeg" : "audio/wav",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (e) {
        // File not found or read error
        return new NextResponse("Audio file not found", { status: 404 });
    }
}
