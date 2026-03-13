import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * GET /api/exotel/audio/[filename]
 *
 * Serves pre-generated TTS MP3 audio files to Exotel's <Play> ExoML tag.
 * Files are stored in os.tmpdir()/exotel-audio/ and cleaned up after the call ends.
 *
 * Exotel requires audio files to be publicly accessible via HTTP.
 * This route serves them directly from the Next.js server.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Basic security: only allow alphanumeric + underscores + hyphens + .mp3
    if (!filename || !/^[\w\-]+\.mp3$/.test(filename)) {
        return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(os.tmpdir(), "exotel-audio", filename);

    if (!fs.existsSync(filePath)) {
        console.warn(`[Exotel Audio] File not found: ${filePath}`);
        return new NextResponse("Audio not found", { status: 404 });
    }

    try {
        const audioBuffer = fs.readFileSync(filePath);
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type":  "audio/mpeg",
                "Content-Length": String(audioBuffer.length),
                "Cache-Control":  "no-store",  // fresh file per request
            },
        });
    } catch (error) {
        console.error("[Exotel Audio] Read error:", error);
        return new NextResponse("Error reading audio", { status: 500 });
    }
}
