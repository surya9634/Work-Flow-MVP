import express from "express";
import next from "next";
import http from "http";
import dotenv from "dotenv";

// Load environment variables immediately before any other dependencies
dotenv.config();

import { WebSocketServer } from "ws";
import { Server as SocketIOServer } from "socket.io";
import { TwilioCallManager } from "./lib/twilio/socket-handler";

// Create a global singleton for Socket.IO so other files can emit events
export let io: SocketIOServer;

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // Initialize Express
    const server = express();

    // Create HTTP server
    const httpServer = http.createServer(server);

    // Create WebSocket server attached to the HTTP server
    const wss = new WebSocketServer({ server: httpServer, path: "/api/twilio/stream" });

    // Initialize Socket.IO for the frontend Dashboard Live Monitoring
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // allow Next.js frontend to connect
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Frontend dashboard client connected: ${socket.id}`);
        socket.on("disconnect", () => {
            console.log(`[Socket.IO] Frontend dashboard client disconnected: ${socket.id}`);
        });
    });

    // Handle WebSocket connections
    wss.on("connection", (ws, req) => {
        console.log(`[WebSocket] New connection established from ${req.socket.remoteAddress}`);

        const callManager = new TwilioCallManager(ws);

        ws.on("message", async (message) => {
            try {
                const msg = JSON.parse(message.toString());
                if (msg.event === "connected") {
                    console.log("[WebSocket] Call connected");
                } else {
                    await callManager.handleMessage(msg);
                }
            } catch (error) {
                console.error("[WebSocket] Message parsing error:", error);
            }
        });

        ws.on("close", () => {
            console.log(`[WebSocket] Connection closed.`);
        });

        ws.on("error", (err) => {
            console.error("[WebSocket] Connection error:", err);
        });
    });

    // Let Next.js handle all other Express routes
    server.use((req: any, res: any) => {
        return handle(req, res);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server listening on ws://${hostname}:${port}/api/twilio/stream`);
    });
}).catch((err) => {
    console.error("Error occurred initializing Next.js", err);
    process.exit(1);
});
