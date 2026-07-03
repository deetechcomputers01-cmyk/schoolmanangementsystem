// ScholarSphere — Claude ↔ Figma Live Bridge
// Runs locally. Figma plugin connects via WebSocket.
// Claude sends design commands via HTTP POST.

const WebSocket = require("ws");
const http = require("http");

let figmaSocket = null;
let cmdCounter = 0;
const pending = new Map(); // id → { resolve, reject, timer }

// ── WebSocket server (Figma plugin connects here) ────────────────────────────
const wss = new WebSocket.Server({ port: 3001 });

wss.on("connection", (ws) => {
  figmaSocket = ws;
  console.log("\n✅ Figma plugin connected — bridge is live!\n");

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const cb = pending.get(msg.id);
      if (cb) {
        clearTimeout(cb.timer);
        pending.delete(msg.id);
        if (msg.error) cb.reject(new Error(msg.error));
        else cb.resolve(msg.result);
      }
    } catch (e) {
      console.error("WS parse error:", e.message);
    }
  });

  ws.on("close", () => {
    figmaSocket = null;
    console.log("⚠️  Figma plugin disconnected");
  });

  ws.on("error", (e) => console.error("WS error:", e.message));
});

// ── HTTP server (Claude posts commands here) ─────────────────────────────────
const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  // GET /status — check if plugin is connected
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      connected: figmaSocket !== null,
      pending: pending.size,
      message: figmaSocket ? "Figma plugin is connected — ready for commands" : "Waiting for Figma plugin to connect"
    }));
    return;
  }

  // POST /command — send a command to Figma
  if (req.method === "POST" && req.url === "/command") {
    if (!figmaSocket || figmaSocket.readyState !== WebSocket.OPEN) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Figma plugin not connected. Open the plugin in Figma first." }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const id = ++cmdCounter;
        const command = { ...JSON.parse(body), id };

        const promise = new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error("Command timed out after 30s"));
          }, 30000);
          pending.set(id, { resolve, reject, timer });
        });

        figmaSocket.send(JSON.stringify(command));
        console.log(`→ [${id}] ${command.action}`, command.name || command.text || "");

        promise
          .then((result) => {
            console.log(`← [${id}] OK`, typeof result === "object" ? JSON.stringify(result).slice(0, 80) : result);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, result }));
          })
          .catch((err) => {
            console.error(`← [${id}] ERR`, err.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON: " + e.message }));
      }
    });
    return;
  }

  // POST /batch — send multiple commands at once
  if (req.method === "POST" && req.url === "/batch") {
    if (!figmaSocket || figmaSocket.readyState !== WebSocket.OPEN) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Figma plugin not connected" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const commands = JSON.parse(body);
        const results = [];
        for (const cmd of commands) {
          const id = ++cmdCounter;
          const command = { ...cmd, id };
          const result = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => { pending.delete(id); reject(new Error("Timeout")); }, 30000);
            pending.set(id, { resolve, reject, timer });
            figmaSocket.send(JSON.stringify(command));
            console.log(`→ [${id}] ${command.action}`, command.name || "");
          });
          results.push({ ok: true, result });
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, results }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(3002, () => {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   ScholarSphere — Claude ↔ Figma Bridge          ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  WebSocket  →  ws://localhost:3001  (plugin)     ║");
  console.log("║  HTTP API   →  http://localhost:3002 (Claude)    ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\nWaiting for Figma plugin to connect...");
  console.log('Open Figma → Plugins → Development → ScholarSphere Design System Builder\n');
});
