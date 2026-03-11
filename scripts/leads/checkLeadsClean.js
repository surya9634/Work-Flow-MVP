const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const campaigns = await prisma.campaign.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: { leads: true }
    });
    for (const c of campaigns) {
        console.log(`Campaign: ${c.name} (${c.type}) - Status: ${c.status}`);
        console.log(`Total Leads: ${c.leads.length}`);
        c.leads.forEach(l => console.log(`  - Lead: ${l.name} | Status: ${l.status}`));
        console.log("----");
    }
}
main();
