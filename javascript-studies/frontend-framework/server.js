// /frontend-framework/server.js

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { memoryCache } from "./framework/utils/request.js";
import fetch from "node-fetch";

import { createServer } from "http";
import { Server as SocketIO } from "socket.io";

// Create an Express application
const app = express();
// Disable the X-Powered-By header for security reasons
app.disable("x-powered-by");

// Determine the port to listen on (default to 3000)
const PORT = process.env.PORT || 3000;

// Create HTTP server on top of Express
const httpServer = createServer(app);

// Initialize Socket.IO on the HTTP server with CORS settings
const io = new SocketIO(httpServer, {
  cors: { origin: "*" }
});

// Middleware to set various security and cache-control headers
app.use((req, res, next) => {
  // Prevent any caching of responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  // CSP: allow self, inline-scripts, eval and inline-styles 
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline';" +
    "img-src 'self' data: https://picsum.photos https://fastly.picsum.photos https://via.placeholder.com https://jsonplaceholder.typicode.com;" +
    "connect-src 'self' https://wttr.in https://picsum.photos https://jsonplaceholder.typicode.com;"
  );

  next();
});

// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Parse JSON bodies in incoming requests
app.use(express.json());

// Determine file path helpers for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Proxy endpoint to fetch a TODO item and cache for 5 minutes
app.get("/api/proxy-todo", async (req, res) => {
  try {
    // Fetch data from external API
    const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    const contentType = response.headers.get("content-type") || "application/json";
    const data = await response.json();

    // Set response headers for content type and caching
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=300");
    res.set("X-Content-Type-Options", "nosniff");

    return res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy error", details: err.message });
  }
});

// Simple API endpoint returning a hello message
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from API!" });
});

// Endpoint to receive a name in the body and return a greeting
app.post("/hello", (req, res) => {
  const { name } = req.body;
  if (typeof name !== "string" || !name.trim()) {
    // Return a 400 error if name is missing or invalid
    return res.status(400).json({ error: "Name is required" });
  }
  res.json({ greeting: `Hello, ${name.trim()}!` });
});

// --- API: serve large file for demonstration of download progress ---
app.get("/api/big-file", (req, res) => {
  const filePath = path.join(__dirname, "example", "public", "big-image.jpg");
  if (!fs.existsSync(filePath)) {
    // Return 404 if file is not found
    return res.status(404).json({ error: "File not found" });
  }
  const stat = fs.statSync(filePath);
  // Set appropriate content type for JPEG image
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Content-Length", stat.size);         
  res.setHeader("Accept-Ranges", "bytes");
  // Stream the file to the client
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

// Dummy upload endpoint that echoes success (emulation)
app.post("/api/upload", (req, res) => {
  res.json({ success: true, message: "File received (emulation)" });
});

// --- Middleware for correct MIME types of JavaScript files ---
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  } else if (req.path.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  next();
});

// --- Static: serve public, example, root ---
app.use(express.static(path.join(__dirname, "example", "public")));
app.use(express.static(path.join(__dirname, "example")));
app.use(express.static("."));

// --- Allow Socket.io routes (to bypass catch-all) ---
app.get("/socket.io/*", (req, res, next) => {
  // Do not serve index.html here, give Socket.io handlers to serve the request
  return next();
});

// Fallback route: serve the main HTML file for all other requests
app.get("*", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(__dirname, "example", "index.html"));
});

// Handle Socket.IO connections and events
io.on("connection", (socket) => {
  console.info(`Socket connected: ${socket.id}`);

  // Listen for incoming chat messages and broadcast to all clients
  socket.on("chat:message", (msg) => {
    io.emit("chat:new-message", {
      id: socket.id,
      text: msg,
      timestamp: Date.now()
    });
  });

  // Log when a client disconnects
  socket.on("disconnect", () => {
    console.info(`Socket disconnected: ${socket.id}`);
  });
});

// --- Start HTTP server (with Socket.io) ---
httpServer.listen(PORT, () => {
  console.log(`Server (with Socket.io) running at http://localhost:${PORT}`);
});

// Handle graceful shutdown on SIGINT: clear cache and exit
process.on("SIGINT", () => {
  console.log("SIGINT received — clearing internal cache and shutting down server…");
  memoryCache.clear();
  process.exit(0);
});
