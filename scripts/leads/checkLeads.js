const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const campaigns = await prisma.campaign.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 2,
        include: { leads: true }
    });
    console.log(JSON.stringify(campaigns, null, 2));
}
main();
