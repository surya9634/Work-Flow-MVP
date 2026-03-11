import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const agent = await prisma.agent.findFirst();
    if (agent) {
        await prisma.campaign.updateMany({
            where: { agentId: null },
            data: { agentId: agent.id }
        });
        console.log(`Updated campaigns without agents to use Agent: ${agent.name}`);
    } else {
        console.log("No agents found in DB. Cannot fix campaigns.");
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
