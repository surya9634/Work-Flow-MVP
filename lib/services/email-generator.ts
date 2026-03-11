import { groq } from "@/lib/groq";

export interface FollowUpEmail {
    subject: string;
    body: string;
}

export class EmailGenerator {
    /**
     * Generate a personalized follow-up email based on the call transcript and outcome.
     */
    static async generateFollowUpEmail(
        transcript: string[],
        outcome: string,
        leadName: string,
        agentName: string,
        companyName: string
    ): Promise<FollowUpEmail> {
        if (transcript.length === 0) {
            return {
                subject: `Sorry we missed you, ${leadName}`,
                body: `Hi ${leadName},\n\nI tried calling but couldn't reach you. Please let me know when is a good time to connect.\n\nBest,\n${agentName}\n${companyName}`
            };
        }

        const prompt = `You are an expert Sales Development Representative named ${agentName} at ${companyName}.
You just finished a phone call with a prospect named ${leadName}.

We analyzed the call and determined the outcome was: "${outcome}"

Below is the transcript of your call:
${transcript.join("\n")}

INSTRUCTIONS:
1. Write a personalized, highly contextual follow-up email to ${leadName}.
2. The email should directly reference specific things said in the transcript.
3. The tone should be professional, warm, and natural.
4. If the outcome was a booked meeting, confirm it. If they asked for more info, provide a placeholder for info. If they were not interested, be polite and keep the door open.
5. Keep it concise (3-4 short paragraphs max).
6. Return the result as a JSON object with a 'subject' and a 'body'.

Return ONLY this structured JSON:
{
  "subject": "Compelling subject line",
  "body": "The plain text body of the email. Use \\n for line breaks."
}`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);

            return {
                subject: parsed.subject || `Follow up from our call - ${companyName}`,
                body: parsed.body || `Hi ${leadName},\n\nThanks for taking the time to speak with me today. Let me know if you have any questions.\n\nBest,\n${agentName}`
            };
        } catch (error) {
            console.error("[EmailGenerator] Error generating email:", error);
            return {
                subject: `Follow up from our call - ${companyName}`,
                body: `Hi ${leadName},\n\nThanks for taking the time to speak with me today. Let me know if you have any questions.\n\nBest,\n${agentName}\n${companyName}`
            };
        }
    }
}
