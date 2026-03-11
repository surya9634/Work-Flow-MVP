import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log("Fixing WhatsApp Phone ID assignments...");

    // The shared test phone number
    const targetNumberId = "850407801500536";

    // First clear all existing
    await prisma.agent.updateMany({
        where: { whatsappPhoneId: targetNumberId },
        data: { whatsappPhoneId: null }
    });

    // We saw from earlier query that dhairya's user is testing this (cmmfaiq1j00041elgam5ayl55)
    // We will assign it exclusively to them
    const newAgentId = "cmmfaiq1j00041elgam5ayl55";
    await prisma.agent.update({
        where: { id: newAgentId },
        data: { whatsappPhoneId: targetNumberId }
    });

    console.log("Successfully re-assigned", targetNumberId, "exclusively to agent", newAgentId);
}

fix().finally(() => prisma.$disconnect());
