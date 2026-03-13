/**
 * EXOTEL SERVICE
 *
 * REST API client for Exotel — India's leading CPaaS platform.
 * Used for outbound and inbound calls to +91 Indian numbers.
 * ~50-60% cheaper than Twilio for Indian PSTN calls.
 *
 * Credentials: EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID, EXOTEL_VIRTUAL_NUMBER
 * Dashboard: https://my.exotel.com
 */

const API_KEY   = process.env.EXOTEL_API_KEY   || "";
const API_TOKEN = process.env.EXOTEL_API_TOKEN  || "";
const SID       = process.env.EXOTEL_ACCOUNT_SID || "";
const SUBDOMAIN = process.env.EXOTEL_SUBDOMAIN  || "api.exotel.com";

// Base URL — Exotel uses HTTP Basic Auth with key:token
const baseUrl = () =>
    `https://${API_KEY}:${API_TOKEN}@${SUBDOMAIN}/v1/Accounts/${SID}`;

/**
 * Detect if a phone number is Indian (+91 or starts with 91).
 * Used for smart routing: Indian numbers → Exotel, others → Twilio.
 */
export function isIndianNumber(phone: string): boolean {
    const normalized = phone.replace(/\s+/g, "").replace(/-/g, "");
    return normalized.startsWith("+91") || normalized.startsWith("91");
}

/**
 * Normalize an Indian number to Exotel's expected format (0XXXXXXXXXX).
 * Exotel requires the number in 10-digit form prefixed with 0.
 */
export function normalizeForExotel(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    // Strip country code: +91XXXXXXXXXX → 0XXXXXXXXXX
    if (digits.startsWith("91") && digits.length === 12) {
        return "0" + digits.slice(2);
    }
    if (digits.length === 10) {
        return "0" + digits;
    }
    return digits; // already formatted
}

export interface ExotelCallOptions {
    to: string;              // prospect's phone number
    callerId: string;        // Exotel virtual number (ExoPhone)
    webhookUrl: string;      // URL Exotel POSTs to when prospect answers
    statusCallbackUrl?: string; // URL for call status updates
    timeLimit?: number;      // max call duration in seconds (default 1800)
}

export interface ExotelCallResponse {
    callSid: string;
    status: string;
    to: string;
    from: string;
}

/**
 * Initiate an outbound call via Exotel REST API.
 */
export async function makeOutboundCall(opts: ExotelCallOptions): Promise<ExotelCallResponse> {
    const body = new URLSearchParams({
        From:         opts.callerId,
        To:           normalizeForExotel(opts.to),
        CallerId:     opts.callerId,
        Url:          opts.webhookUrl,
        TimeLimit:    String(opts.timeLimit ?? 1800),
        Record:       "false",   // we handle recording ourselves via ExoML
        ...(opts.statusCallbackUrl && { StatusCallbackUrl: opts.statusCallbackUrl }),
    });

    const res = await fetch(`${baseUrl()}/Calls/connect.json`, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "unknown");
        throw new Error(`[Exotel] makeOutboundCall failed (${res.status}): ${err}`);
    }

    const json = await res.json();
    const call = json?.Call;
    return {
        callSid: call?.Sid      || "",
        status:  call?.Status   || "queued",
        to:      call?.To       || opts.to,
        from:    call?.From     || opts.callerId,
    };
}

/**
 * Get details of a call by CallSid.
 */
export async function getCallDetails(callSid: string) {
    const res = await fetch(`${baseUrl()}/Calls/${callSid}.json`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.Call || null;
}

/**
 * Build an ExoML response: play audio then record the prospect's response.
 * This is the core turn-based flow. Audio URL must be publicly accessible.
 *
 * @param audioUrl   - URL to the pre-generated TTS MP3
 * @param recordHook - URL Exotel will POST the recording to
 * @param maxLength  - max recording seconds (default 30)
 */
export function buildExomlTurn(
    audioUrl: string,
    recordHook: string,
    maxLength = 30
): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${audioUrl}</Play>
    <Record
        action="${recordHook}"
        method="POST"
        timeout="3"
        finishOnKey="#"
        maxLength="${maxLength}"
        playBeep="false" />
</Response>`.trim();
}

/**
 * Build an ExoML response that just plays audio and hangs up.
 * Used for the final turn or goodbye message.
 */
export function buildExomlFinal(audioUrl: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${audioUrl}</Play>
    <Hangup />
</Response>`.trim();
}

/**
 * Build an ExoML response that immediately hangs up (no audio).
 */
export function buildExomlHangup(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Hangup />
</Response>`.trim();
}
