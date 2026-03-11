import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const sqlite = new Database('dev.db');
const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to databases...');

    try {
        // 1. Migrate Users
        console.log('Migrating Users...');
        const users = sqlite.prepare('SELECT * FROM User').all() as any[];
        for (const u of users) {
            await prisma.user.upsert({
                where: { id: u.id },
                update: {},
                create: {
                    id: u.id,
                    email: u.email,
                    passwordHash: u.passwordHash,
                    name: u.name,
                    businessName: u.businessName,
                    industry: u.industry,
                    businessDesc: u.businessDesc,
                    onboardingComplete: Boolean(u.onboardingComplete),
                    createdAt: new Date(u.createdAt),
                    updatedAt: new Date(u.updatedAt),
                    credits: u.credits
                }
            });
        }

        // 2. Migrate Leads
        console.log('Migrating Leads...');
        const leads = sqlite.prepare('SELECT * FROM Lead').all() as any[];
        for (const l of leads) {
            // Postgres needs strict references. If campaignId or userId doesn't exist, we must drop relation or handle it.
            // Easiest is to just copy fields safely, assuming they exist
            await prisma.lead.upsert({
                where: { id: l.id },
                update: {},
                create: {
                    id: l.id,
                    userId: l.userId,

                    name: l.name,
                    phone: l.phone,
                    email: l.email,
                    source: l.source,
                    status: l.status,
                    score: l.score,
                    lastCall: l.lastCall ? new Date(l.lastCall) : null,
                    metadata: l.metadata,
                    createdAt: new Date(l.createdAt),
                    updatedAt: new Date(l.updatedAt)
                }
            });
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        sqlite.close();
        await prisma.$disconnect();
    }
}

main();
