const { Client } = require('pg');
require('dotenv').config();

// Supabase direct connection requires using the direct transaction port or just using pg directly instead of PgBouncer if pgbouncer is problematic.
// The DATABASE_URL in .env is: postgres://postgres.dehofgkssgiyxngzxvub:agent_aham2708@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
// I will connect to it normally using pg.

async function main() {
    const connectionString = process.env.DATABASE_URL;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("=== CONNECTED TO DB ===");
        const res = await client.query('SELECT id, name, email, role, "passwordHash" FROM "User"'); // user table is "User" in Prisma
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        // If table doesn't have "role" or "passwordHash" quotes matter in Postgres for Prisma.
        console.error("Query Error:", err.message);
        try {
            const res2 = await client.query('SELECT id, name, email, "passwordHash" FROM "User"');
            console.log(JSON.stringify(res2.rows, null, 2));
        } catch (e) {
            console.error("Fallback Query Error:", e.message);
        }
    } finally {
        await client.end();
    }
}

main();
