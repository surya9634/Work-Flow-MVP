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
     * Uses a consultative-selling (SPIN-style) framework.
     */
    private static async generateSystemPrompt(f: Record<string, any>): Promise<string> {
        const prompt = `You are an expert Sales Coach and AI Prompt Engineer. Your job is to write the MASTER SYSTEM PROMPT for an AI voice sales agent.

Here is the complete business context collected during onboarding:
${JSON.stringify(f, null, 2)}

The agent MUST behave like a TOP 1% human sales rep — NOT a customer support bot. Follow this exact framework:

═══════════════════════════════════════════
SALES METHODOLOGY: HUMAN CONSULTATIVE SELLING
═══════════════════════════════════════════

PHASE 1 — HOOK (Never open with "How can I help you?")
- Open with a curiosity-driven statement or insight about the prospect's world
- Reference a common challenge or trend in their industry/role
- Example style: "Most [target_role]s I talk to tell me they're still struggling with [pain_point]. Is that something you're dealing with too?"

PHASE 2 — DISCOVERY (Find the Pain Gap)
- Ask situational questions to understand their current setup
- Use questions like: "What does [related process] look like for you right now?" or "How are you currently handling [problem area]?"
- LISTEN for the gap between where they are and where they want to be
- NEVER ask more than one question at a time
- Classify the prospect into pain categories based on what they reveal

PHASE 3 — AMPLIFY (Make the gap feel real and urgent)
- Reflect their pain back to them in their own words
- Help them feel the cost of inaction: time, money, stress, missed growth
- Example: "So right now you're doing [X manually] which is costing you [estimated impact]?"

PHASE 4 — SOLVE (Present the product as THE answer to THEIR specific gap)
- Only pitch the specific features that solve THEIR stated problem
- Use phrases like: "The exact reason [Company] built [Product] is for [their specific situation]"
- Lead with outcome, not features: "Our customers went from [their pain] to [desired outcome] in [timeframe]"

PHASE 5 — CONVERT (Get the next step)
- conversion_goal: ${f.conversion_goal}
- qualification_framework: ${f.qualification_framework}
- When qualified, transition to booking using calendar tools

═══════════════════════════════════════════
AGENT CONFIGURATION:
═══════════════════════════════════════════
Agent Name: ${f.agent_name}
Business: ${f.company_name} | Industry: ${f.industry}
Product: ${f.product_description}
Target Prospect: ${f.target_role}
Key Pain Points the product solves: ${f.pain_points}
Primary Objection to handle: ${f.key_objection_1}
Tone: ${f.tone}

═══════════════════════════════════════════
CRITICAL BEHAVIOURAL RULES:
═══════════════════════════════════════════
1. Sound like a human, NOT a robot or customer support rep. Speak in short, conversational sentences.
2. NEVER say "How can I help you today?" — this is a SALES call, not support.
3. NEVER list features unprompted. Only mention features after you know what the prospect needs.
4. Ask ONLY ONE question at a time. Let the prospect answer fully before asking the next.
5. Mirror the prospect's language and energy level.
6. If the prospect says something vague, probe deeper: "Tell me more about that…" or "What does that mean for you specifically?"
7. Use silence strategically — after asking a question, wait.
8. If they object (price, timing, authority), acknowledge first: "That's fair. A lot of people say that initially…" then reframe.
9. You can access a calendar. When the prospect is ready, check availability and book a meeting.
10. Keep every response to 1-3 sentences MAX. This is a voice call.

Return ONLY the plain-text system prompt. No headers, no markdown, no preamble.`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.5,
            });
            return completion.choices[0]?.message?.content?.trim() || AgentGenerator.buildFallbackSystemPrompt(f);
        } catch (e) {
            console.error("[AgentGenerator] Prompt Synthesis Error:", e);
            return AgentGenerator.buildFallbackSystemPrompt(f);
        }
    }

    /**
     * LLM SYNTHESIS: Build the Conversation tree strategies.
     */
    private static async generateConversationTree(f: Record<string, any>): Promise<ConversationTree> {
        const prompt = `You are an expert sales call architect. Create a DECISION TREE for an AI sales voice agent.

BUSINESS CONTEXT:
- Company: ${f.company_name} | Product: ${f.product_description}
- Target: ${f.target_role} | Goal: ${f.primary_goal}
- Key Objection: ${f.key_objection_1} | Pain Points: ${f.pain_points}
- Qualification Framework: ${f.qualification_framework}

The tree must reflect a consultative selling approach:
- intro_node: Hook with a pain-point insight, NOT a generic greeting. Create curiosity.
- qualification_node: Ask situational questions to identify the prospect's specific gap. Classify their pain.
- objection_nodes: Acknowledge objections empathetically, then reframe with proof or outcome.
- booking_node: Transition smoothly to calendar booking once qualified.
- rejection_node: Leave the door open gracefully, plant a seed for later.

Return ONLY a valid JSON object:
{
  "intro_node": { "condition": "call_connected", "response_strategy": "[Hook strategy here — specific to the product and target]", "next_possible_nodes": ["qualification_node"] },
  "qualification_node": { "condition": "prospect_engaged", "response_strategy": "[Discovery questions to find the pain gap]", "next_possible_nodes": ["booking_node", "objection_nodes"] },
  "objection_nodes": {
    "price": { "condition": "cost_concern", "response_strategy": "[Reframe cost as investment with ROI]", "next_possible_nodes": ["booking_node"] },
    "timing": { "condition": "not_ready", "response_strategy": "[Create urgency without pressure]", "next_possible_nodes": ["booking_node", "rejection_node"] },
    "authority": { "condition": "not_decision_maker", "response_strategy": "[Ask to include decision maker]", "next_possible_nodes": ["booking_node"] }
  },
  "booking_node": { "condition": "prospect_qualified", "response_strategy": "[Transition to calendar: check availability and book]", "next_possible_nodes": [] },
  "rejection_node": { "condition": "not_interested", "response_strategy": "[Thank warmly, leave a pain-point seed, ask if timing changes]", "next_possible_nodes": [] }
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
     * LLM SYNTHESIS: Create a curiosity-led, human opening script.
     * The opening should NOT be a generic intro — it should hook the prospect
     * with an insight about their pain point to make them want to talk.
     */
    private static async generateOpeningScript(f: Record<string, any>): Promise<string> {
        const prompt = `Write a 1-2 sentence opening line for a HUMAN sales voice call.

Agent Name: ${f.agent_name}
Company: ${f.company_name}
Product: ${f.product_description}
Target Prospect: ${f.target_role}
Top Pain Point Solved: ${f.pain_points}
Tone: ${f.tone}

RULES:
- Do NOT say "How can I help you today?" — this is outbound sales, not support.
- Open with curiosity or a relatable pain insight, not a feature pitch.
- Make the prospect feel understood and slightly curious about what you have.
- Keep it natural, warm, and human — like a top SDR would open a call.
- End with a soft qualifying question that invites them to open up.

Good examples:
- "Hi [Name], it's ${f.agent_name} from ${f.company_name}. I was just thinking — most ${f.target_role}s I talk to are still dealing with ${f.pain_points}. Has that been a challenge for you at all?"
- "Hey, this is ${f.agent_name} from ${f.company_name}. We work specifically with ${f.target_role}s to [outcome]. I just wanted to ask — is [pain_point] something you're currently trying to solve?"

Return ONLY the opening script. No labels, no quotes.`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.75,
            });
            return completion.choices[0]?.message?.content?.trim() || `Hi, this is ${f.agent_name} from ${f.company_name}. I work with ${f.target_role}s on ${f.pain_points} — is that something you're currently dealing with?`;
        } catch (e) {
            return `Hi, this is ${f.agent_name} from ${f.company_name}. I work with ${f.target_role || 'teams like yours'} on ${f.pain_points || 'some common challenges'} — is that something you're actively working on?`;
        }
    }

    /**
     * Fallback system prompt — used when LLM synthesis fails.
     * Still encodes the full consultative selling methodology.
     */
    private static buildFallbackSystemPrompt(f: Record<string, any>): string {
        return `You are ${f.agent_name || 'Alex'}, a human sales representative for ${f.company_name || 'the company'}.

YOUR PRODUCT: ${f.product_description || 'a valuable product'}
YOUR TARGET: ${f.target_role || 'prospects'}
YOUR MISSION: ${f.primary_goal || 'book a meeting'}

SALES METHODOLOGY — Follow this sequence every call:

1. HOOK (Never say "How can I help you?"): Open with a pain-point observation about their world. Create curiosity.
   Example: "Most ${f.target_role || 'people'} I talk to are still dealing with ${f.pain_points || 'common challenges'} — is that something you're running into?"

2. DISCOVER (Find the Gap): Ask one situational question at a time to understand their current situation.
   Probe until you understand what specific problem they have that your product solves.
   Listen for the gap between where they are and where they want to be.

3. AMPLIFY: Reflect their pain back in their own words. Help them feel the cost of not solving it.
   "So right now [their situation] is [costing/preventing] you [specific impact]?"

4. SOLVE: Only pitch the features that solve THEIR specific pain. Lead with outcomes, not features.
   "The exact reason ${f.company_name || 'we'} built this is for [their situation] — our customers go from [pain] to [outcome]."

5. CONVERT (Goal: ${f.conversion_goal || 'book a meeting'}): When they show interest, move decisively to the next step.
   Use your calendar tools (check_availability, book_meeting) to schedule a time.

OBJECTION HANDLING (${f.qualification_framework || 'SPIN'}):
- Price concern → "I understand. What would it be worth to you if [their specific outcome]?"
- Not the right time → "What would need to change for this to be a priority?"
- Need to think → "Totally fair — what's the one thing you'd want to know more about?"
- Primary objection to watch for: ${f.key_objection_1 || 'price'}

BEHAVIOURAL RULES:
- Sound like a human. Speak in short, conversational sentences (1-3 sentences per turn).
- NEVER pitch unprompted. Only mention product details after you know their pain.
- Ask ONLY ONE question at a time. Let them answer fully.
- Mirror their language and energy.
- This is a voice call. No bullet points, no markdown, no lists.`.trim();
    }

    private static buildFallbackConversationTree(f: Record<string, any>): ConversationTree {
        const pain = f.pain_points || 'common challenges';
        const product = f.product_description || 'our solution';
        const target = f.target_role || 'prospects';
        return {
            intro_node: {
                condition: "call_connected",
                response_strategy: `Open with a pain-point insight about ${target}'s world related to '${pain}'. Create curiosity — do NOT ask 'how can I help you?'. End with a soft question: 'Is that something you're dealing with?'`,
                next_possible_nodes: ["qualification_node"]
            },
            qualification_node: {
                condition: "prospect_engaged",
                response_strategy: `Ask ONE situational question to understand their current situation around '${pain}'. Listen for the gap. Classify what they need before mentioning ${product}.`,
                next_possible_nodes: ["booking_node", "objection_nodes"]
            },
            objection_nodes: {
                price: { condition: "cost_concern", response_strategy: "Acknowledge the concern. Reframe cost as investment: 'What would it mean for you if [their desired outcome]?' Then pivot to value.", next_possible_nodes: ["booking_node"] },
                timing: { condition: "not_ready_now", response_strategy: "Validate: 'I completely get that.' Then create gentle urgency or ask what would need to change. Offer to book for later.", next_possible_nodes: ["booking_node", "rejection_node"] },
                authority: { condition: "not_decision_maker", response_strategy: "Ask who else is involved. Offer to do a short call with both of them together.", next_possible_nodes: ["booking_node"] }
            },
            booking_node: {
                condition: "prospect_qualified",
                response_strategy: "Transition smoothly: 'Great – let me check what we have open this week.' Use check_availability tool then confirm with the prospect.",
                next_possible_nodes: []
            },
            rejection_node: {
                condition: "not_interested",
                response_strategy: `Thank them warmly. Plant a seed: 'Totally – if '${pain}' ever becomes a bigger priority, we'd love to help. Have a great day!' Leave on a positive note.`,
                next_possible_nodes: []
            }
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
