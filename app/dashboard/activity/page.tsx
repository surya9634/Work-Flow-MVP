import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityThread } from "./activity-thread"

async function getGroupedActivityLogs(userId: string) {
    const callLogs = await prisma.callLog.findMany({
        where: { agent: { userId: userId } },
        include: {
            lead: true,
            agent: true,
            campaign: true
        },
        orderBy: { createdAt: 'desc' },
        take: 200 // Fetch a larger pool to build threads
    });

    const interactionLogs = await prisma.interactionLog.findMany({
        where: { agent: { userId: userId } },
        include: {
            lead: true,
            agent: true,
            campaign: true
        },
        orderBy: { createdAt: 'desc' },
        take: 200
    });

    // Merge everything into one giant array of activities
    const allActivities = [
        ...callLogs.map(log => ({ ...log, activityType: 'CALL' })),
        ...interactionLogs.map(log => ({ ...log, activityType: 'INTERACTION' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Grouping logic by Lead ID or Phone Number
    const groupedMap = new Map<string, any>();

    for (const item of allActivities) {
        // Find a unique identifier for the thread
        let threadKey = "Unknown";
        let displayTitle = "Unknown Number";
        
        if (item.lead) {
            threadKey = `lead_${item.lead.id}`;
            displayTitle = item.lead.name || item.lead.phone;
        } else if (item.agent && item.activityType === 'INTERACTION' && (item as any).message) {
            // Fallback for interactions without leads (e.g. unknown numbers in webhook)
            // Group all old unknown system events together instead of individual threads
            threadKey = `system_events_unlinked`;
            displayTitle = "System Event";
        } else {
             threadKey = `system_events_unlinked`;
        }

        if (!groupedMap.has(threadKey)) {
            groupedMap.set(threadKey, {
                id: threadKey,
                title: displayTitle,
                lead: item.lead || null,
                latestActivity: item.createdAt,
                activities: [],
                callCount: 0,
                msgCount: 0
            });
        }

        const group = groupedMap.get(threadKey);
        group.activities.push(item);
        if (item.activityType === 'CALL') group.callCount++;
        if (item.activityType === 'INTERACTION') group.msgCount++;
    }

    // Convert map to array and sort by the most recent activity in the thread
    const threadsArray = Array.from(groupedMap.values()).sort((a, b) => 
        new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime()
    );

    return threadsArray.slice(0, 50); // Keep top 50 recent threads
}

export default async function ActivityPage() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        redirect("/login")
    }

    const userId = (session.user as any).id;
    if (!userId) {
        redirect("/login");
    }

    // Server-side fetching
    const groupedThreads = await getGroupedActivityLogs(userId)

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Activity Conversations</h1>
                <p className="text-zinc-400">View a unified feed of all voice calls and text messages, grouped by contact.</p>
            </div>

            <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-zinc-100">Inbox</CardTitle>
                    <CardDescription className="text-zinc-500">Your most recent conversations</CardDescription>
                </CardHeader>
                <CardContent>
                    {groupedThreads.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            No conversations found. Run a campaign or interact with an agent to see logs here.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* We pass the server-fetched data to a Client Component to handle expansion/collapse */}
                            {groupedThreads.map((thread) => (
                                <ActivityThread key={thread.id} thread={thread} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
