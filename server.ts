import express from "express";
import next from "next";
import http from "http";
import dotenv from "dotenv";

// Load environment variables immediately before any other dependencies
dotenv.config();

import { Server as SocketIOServer } from "socket.io";

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

    // Let Next.js handle all other Express routes
    server.use((req: any, res: any) => {
        return handle(req, res);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
}).catch((err) => {
    console.error("Error occurred initializing Next.js", err);
    process.exit(1);
});
