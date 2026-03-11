import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIds() {
    const agents = await prisma.agent.findMany({
        where: {
            whatsappPhoneId: { not: null }
        },
        select: {
            id: true,
            name: true,
            whatsappPhoneId: true,
            user: {
                select: { email: true, name: true }
            }
        }
    });
    console.log(JSON.stringify(agents, null, 2));
}

checkIds().finally(() => prisma.$disconnect());
