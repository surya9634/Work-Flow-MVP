import { prisma } from "@/lib/prisma";

/**
 * DEPLOYMENT & INTEGRATION SERVICE
 * 
 * Manages agent lifecycle: deploy, pause, update, version, rollback.
 */

export class DeploymentService {

    /**
     * Deploy an agent — set to ACTIVE, assign phone.
     */
    static async deployAgent(agentId: string): Promise<{ success: boolean; message: string }> {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) return { success: false, message: "Agent not found." };
        if (!agent.systemPrompt) return { success: false, message: "Agent has no system prompt. Complete onboarding first." };

        // Find available phone number
        const phone = await prisma.phoneNumber.findFirst({
            where: { status: "AVAILABLE" }
        });

        await prisma.agent.update({
            where: { id: agentId },
            data: {
                status: "ACTIVE",
                phoneNumberId: phone?.id || null
            }
        });

        if (phone) {
            await prisma.phoneNumber.update({
                where: { id: phone.id },
                data: { status: "ASSIGNED", assignedTo: agentId }
            });
        }

        // TODO: Register webhook endpoints with voice provider (Twilio/Vapi)
        // TODO: Activate voice runtime service connection

        return { success: true, message: `Agent deployed! ${phone ? `Assigned phone: ${phone.number}` : "No phone number available."}` };
    }

    /**
     * Pause an active agent.
     */
    static async pauseAgent(agentId: string) {
        await prisma.agent.update({
            where: { id: agentId },
            data: { status: "PAUSED" }
        });
        return { success: true, message: "Agent paused." };
    }

    /**
     * Update agent config and increment version.
     */
    static async updateAgent(agentId: string, newConfig: Record<string, any>) {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) return { success: false, message: "Agent not found." };

        const newVersion = agent.version + 1;

        // Save version snapshot
        await prisma.agentVersion.create({
            data: {
                agentId: agent.id,
                version: newVersion,
                configSnapshot: JSON.stringify(newConfig)
            }
        });

        // Update agent
        await prisma.agent.update({
            where: { id: agentId },
            data: {
                configSnapshot: JSON.stringify(newConfig),
                version: newVersion,
                systemPrompt: newConfig.systemPrompt || agent.systemPrompt,
            }
        });

        return { success: true, message: `Agent updated to v${newVersion}.` };
    }

    /**
     * Rollback to a previous version.
     */
    static async rollbackAgent(agentId: string, targetVersion: number) {
        const versionRecord = await prisma.agentVersion.findFirst({
            where: { agentId, version: targetVersion }
        });

        if (!versionRecord) return { success: false, message: `Version ${targetVersion} not found.` };

        const oldConfig = JSON.parse(versionRecord.configSnapshot);

        await prisma.agent.update({
            where: { id: agentId },
            data: {
                configSnapshot: versionRecord.configSnapshot,
                version: targetVersion,
                systemPrompt: oldConfig.systemPrompt || null
            }
        });

        return { success: true, message: `Agent rolled back to v${targetVersion}.` };
    }

    /**
     * Get all versions for an agent.
     */
    static async getVersionHistory(agentId: string) {
        return prisma.agentVersion.findMany({
            where: { agentId },
            orderBy: { version: "desc" }
        });
    }
}
