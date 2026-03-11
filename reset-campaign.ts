import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const updatedCampaigns = await prisma.campaign.updateMany({
        data: { status: 'DRAFT' }
    });
    console.log(`Reset ${updatedCampaigns.count} Campaigns to DRAFT.`);

    const updatedLeads = await prisma.lead.updateMany({
        data: { status: 'NEW' }
    });
    console.log(`Reset ${updatedLeads.count} Leads to NEW.`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
