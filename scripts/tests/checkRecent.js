const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const logs = await prisma.interactionLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("Recent Interaction Logs:");
    console.log(JSON.stringify(logs, null, 2));

    const verify = await prisma.campaign.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 2,
        select: { id: true, name: true, type: true, status: true, updatedAt: true }
    });
    console.log("\nRecent Campaigns:");
    console.log(JSON.stringify(verify, null, 2));
}
main();
