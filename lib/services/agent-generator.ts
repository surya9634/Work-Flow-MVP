import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/groq";

/**
 * AGENT GENERATION ENGINE
 * 
 * Trigger: All critical fields collected AND confidence_score > 80%.
 * Generates: System prompt, opening script, conversation tree, objection framework.
 */

interface AgentBlueprint {
    name: string;
    systemPrompt: string;
    openingScript: string;
    conversationTree: ConversationTree;
    voiceProfile: VoiceProfile;
}

interface VoiceProfile {
    gender: string;
    tone: string;
    speed: string;
    language: string;
}

interface ConversationTree {
    intro_node: TreeNode;
    qualification_node: TreeNode;
    objection_nodes: Record<string, TreeNode>;
    booking_node: TreeNode;
    rejection_node: TreeNode;
}

interface TreeNode {
    condition: string;
    response_strategy: string;
    next_possible_nodes: string[];
}

export class AgentGenerator {

    /**
     * Generate a complete agent configuration from collected onboarding fields.
     */
    static async generate(userId: string, fields: Record<string, any>): Promise<AgentBlueprint> {
        console.log(`[AgentGenerator] Starting LLM-driven synthesis for: ${fields.agent_name || "New Agent"}`);

        // Perform parallel LLM synthesis for speed
        const [systemPrompt, conversationTree, openingScript] = await Promise.all([
            AgentGenerator.generateSystemPrompt(fields),
            AgentGenerator.generateConversationTree(fields),
            AgentGenerator.generateOpeningScript(fields)
        ]);

        const voiceProfile = AgentGenerator.buildVoiceProfile(fields);

        // Save to database
        const agent = await prisma.agent.create({
            data: {
                userId,
                name: fields.agent_name || "Agent",
                status: "READY",
                systemPrompt,
                openingScript,
                convTree: JSON.stringify(conversationTree),
                voiceProfile: JSON.stringify(voiceProfile),
                configSnapshot: JSON.stringify(fields),
                version: 1
            }
        });

        // Save version snapshot
        await prisma.agentVersion.create({
            data: {
                agentId: agent.id,
                version: 1,
                configSnapshot: JSON.stringify(fields)
            }
        });

        return {
            name: fields.agent_name || "Agent",
            systemPrompt,
            openingScript,
            conversationTree,
            voiceProfile
        };
    }

    /**
     * LLM SYNTHESIS: Build the master system prompt.
     */
    private static async generateSystemPrompt(f: Record<string, any>): Promise<string> {
        const prompt = `You are a Senior Sales Engineer. Synthesize a MASTER SYSTEM PROMPT for an AI Sales Agent.

BUSINESS DATA:
${JSON.stringify(f, null, 2)}

INSTRUCTIONS:
1. Define a powerful Persona based on the 'tone' and 'agent_name'.
2. Incorporate the PRODUCT values and PAIN POINTS deeply.
3. Define the MISSION: ${f.primary_goal}.
4. Set strict CONSTRAINTS: stay under 2 sentences, be natural, handle objections using '${f.qualification_framework}'.

OUTPUT CATEGORIES:
- ROLE & PERSONA
- PRODUCT KNOWLEDGE
- QUALIFICATION STRATEGY
- TONE & STYLE CONSTRAINTS
- CALENDAR & BOOKING RULES (You have access to 'check_availability' and 'book_meeting' tools. If the prospect agrees to a meeting, check your calendar and confirm a time.)

Return ONLY the plain-text system prompt content. No preamble.`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.6,
            });
            return completion.choices[0]?.message?.content?.trim() || "You are a professional sales AI.";
        } catch (e) {
            console.error("[AgentGenerator] Prompt Synthesis Error:", e);
            return AgentGenerator.buildFallbackSystemPrompt(f);
        }
    }

    /**
     * LLM SYNTHESIS: Build the Conversation tree strategies.
     */
    private static async generateConversationTree(f: Record<string, any>): Promise<ConversationTree> {
        const prompt = `Synthesize a DECISION TREE for an AI Sales Call.

BUSINESS: ${f.company_name}
GOAL: ${f.primary_goal}
OBJECTION: ${f.key_objection_1}

Return ONLY a JSON object matching this interface:
{
  "intro_node": { "condition": "call_connected", "response_strategy": "..." },
  "qualification_node": { "condition": "engaged", "response_strategy": "..." },
  "objection_nodes": {
    "primary": { "condition": "objection raised", "response_strategy": "..." }
  },
  "booking_node": { "condition": "qualified", "response_strategy": "..." },
  "rejection_node": { "condition": "not interested", "response_strategy": "..." }
}`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            const content = completion.choices[0]?.message?.content || "{}";
            return JSON.parse(content);
        } catch (e) {
            console.error("[AgentGenerator] Tree Synthesis Error:", e);
            return AgentGenerator.buildFallbackConversationTree(f);
        }
    }

    /**
     * LLM SYNTHESIS: Create a high-converting opening script.
     */
    private static async generateOpeningScript(f: Record<string, any>): Promise<string> {
        const prompt = `Write a 1-sentence opening script for a sales call.
Business: ${f.company_name}
Goal: ${f.primary_goal}
Tone: ${f.tone}
Agent Name: ${f.agent_name}

The script should be natural, non-robotic, and value-led.
Example: "Hi, this is Aria from SalesOS. We helps coaches automate their booking. Do you have a minute?"
Return ONLY the script text.`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.8,
            });
            return completion.choices[0]?.message?.content?.trim() || `Hi, this is ${f.agent_name}. How are you?`;
        } catch (e) {
            return `Hi, this is ${f.agent_name} from ${f.company_name}. Do you have a quick minute?`;
        }
    }

    /**
     * Fallback builders in case of LLM failure.
     */
    private static buildFallbackSystemPrompt(f: Record<string, any>): string {
        return `You are ${f.agent_name}, a professional ${f.tone} AI sales development representative for ${f.company_name}.
Your primary goal is to: ${f.primary_goal}.

PRODUCT KNOWLEDGE:
Our product solves: ${f.pain_points}.

CONVERSATION RULES:
1. Keep responses extremely concise (1-2 sentences).
2. Sound like a natural human on the phone. Do not use markdown, emojis, or lists.
3. Gently address objections using the framework: ${f.qualification_framework}.
4. You have access to a Calendar. If a user asks for a meeting, use your tools to check availability and book it. Validate the time they prefer first.
5. If they mention ${f.key_objection_1}, gracefully pivot.`.trim();
    }

    private static buildFallbackConversationTree(f: Record<string, any>): ConversationTree {
        return {
            intro_node: { condition: "call_connected", response_strategy: "Greet and explain value.", next_possible_nodes: ["qualification_node"] },
            qualification_node: { condition: "engaged", response_strategy: "Ask qualification questions.", next_possible_nodes: ["booking_node", "objection_nodes"] },
            objection_nodes: { primary: { condition: "objection", response_strategy: "Handle concern naturally.", next_possible_nodes: ["booking_node"] } },
            booking_node: { condition: "interested", response_strategy: "Ask for a meeting.", next_possible_nodes: [] },
            rejection_node: { condition: "not_interested", response_strategy: "Thank them.", next_possible_nodes: [] }
        };
    }

    /**
     * Build voice profile configuration.
     */
    private static buildVoiceProfile(f: Record<string, any>): VoiceProfile {
        return {
            gender: f.voice_gender || "male",
            tone: f.tone || "professional",
            speed: "normal",
            language: "en-US"
        };
    }
}
