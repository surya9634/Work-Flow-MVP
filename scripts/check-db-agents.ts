import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function checkAgents() {
    const agents = await prisma.agent.findMany();
    let output = `Found ${agents.length} agents:\n`;
    agents.forEach(a => {
        output += `- ID: ${a.id}, Name: ${a.name}, VoiceProfile: ${a.voiceProfile}\n`;
    });
    fs.writeFileSync("db_agents_check.txt", output);
    console.log("Check complete. See db_agents_check.txt");
}

checkAgents().finally(() => prisma.$disconnect());
