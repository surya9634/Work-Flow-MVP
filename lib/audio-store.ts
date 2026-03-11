/**
 * Global in-memory store for TTS audio buffers.
 * Socket handler writes MP3 buffers here; the /api/audio/[id] route serves them.
 * Entries are auto-deleted after 5 minutes to prevent memory leaks.
 */
export const audioStore = new Map<string, Buffer>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function storeAudio(id: string, buffer: Buffer) {
    audioStore.set(id, buffer);
    setTimeout(() => audioStore.delete(id), TTL_MS);
}
