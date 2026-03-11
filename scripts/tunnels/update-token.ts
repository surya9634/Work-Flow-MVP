import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateToken() {
    await prisma.user.updateMany({
        data: {
            metaAccessToken: 'EAAMkYNZBfkMYBQ5ev4Kr94v7G6SiuSuGPwDCO0701pfCl4iqiYYvC98IKbxiCLBFhXIPUzuJUvdXs5Bvy3BeIF37knYUOec3hzKM483MXtRLOITmPAsdZBBTBVqQWfRpZAtG9rZAzLdtroI8RZAYp2kGEYMWcAVoaL4ThAcO2Mjb6V7eC5gjzmkYRZAvZCmz4Xpq24XVGHZAXJDqnizJgK2IiOQKP7RvXNcpLBZCNsXNtxsZA4T50qMHhteiZC4Im1DBM1mKFyzQttNjJgktSzrYvw3RjLIaZAX1caBgZAgZDZD'
        }
    });
    console.log('Successfully updated all users in DB with new Meta Access Token.');
}

updateToken()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
