const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const verify = await prisma.campaign.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, name: true, type: true, status: true, agentId: true, updatedAt: true }
    });
    console.log("\nRecent Campaigns:");
    console.log(JSON.stringify(verify, null, 2));
}
main();
