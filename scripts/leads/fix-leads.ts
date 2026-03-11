import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const campaign = await prisma.campaign.findFirst({ orderBy: { createdAt: 'desc' } });

    if (campaign) {
        const updated = await prisma.lead.updateMany({
            where: { campaignId: null },
            data: { campaignId: campaign.id }
        });
        console.log(`Updated ${updated.count} orphaned leads to point to Campaign: ${campaign.name} (${campaign.id})`);
    } else {
        console.log("No campaigns found.");
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
