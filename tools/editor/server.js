// Local-only admin editor server. No dependencies. Run: node server.js
// Serves the static UI and validates ADMIN_PASSWORD (from .env) server-side,
// so the password never ships inside the HTML.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnv() {
    const file = path.join(__dirname, ".env");
    if (!fs.existsSync(file)) return {};
    const out = {};
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
}

const env = loadEnv();
const PASSWORD = env.ADMIN_PASSWORD;
const PORT = Number(env.PORT) || 5599;
const API_KEY = env.ADMIN_API_KEY;
const API_BASE = (env.API_BASE || "https://farmacopedia.onrender.com").replace(/\/$/, "");

if (!API_KEY) {
    console.error("ERROR: define ADMIN_API_KEY en tools/editor/.env (misma clave que en Render).");
    process.exit(1);
}

if (!PASSWORD || PASSWORD === "change-me") {
    console.error("ERROR: define ADMIN_PASSWORD en tools/editor/.env (distinto de 'change-me').");
    process.exit(1);
}

const tokens = new Set();
const FILES = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/app.js": ["app.js", "text/javascript; charset=utf-8"],
    "/style.css": ["style.css", "text/css; charset=utf-8"],
};

const safeEqual = (a, b) => {
    const ha = crypto.createHash("sha256").update(String(a)).digest();
    const hb = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
};

http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/auth") {
        let body = "";
        req.on("data", (c) => { body += c; if (body.length > 1e4) req.destroy(); });
        req.on("end", () => {
            let pwd = "";
            try { pwd = JSON.parse(body).password; } catch { /* ignore */ }
            if (pwd && safeEqual(pwd, PASSWORD)) {
                const token = crypto.randomBytes(24).toString("hex");
                tokens.add(token);
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ ok: true, token }));
            }
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false }));
        });
        return;
    }
    if (req.method === "GET" && req.url === "/config") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ apiBase: API_BASE, prod: API_BASE.includes("onrender.com") }));
    }
    if (req.url.startsWith("/api/")) {
        const t = (req.headers.authorization || "").replace("Bearer ", "");
        if (!tokens.has(t)) { res.writeHead(401); return res.end(); }
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", async () => {
            try {
                const body = chunks.length ? Buffer.concat(chunks) : undefined;
                const r = await fetch(API_BASE + req.url.slice(4), {
                    method: req.method,
                    headers: { "Content-Type": "application/json", "x-admin-key": API_KEY },
                    body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
                });
                res.writeHead(r.status, { "Content-Type": "application/json" });
                res.end(Buffer.from(await r.arrayBuffer()));
            } catch (e) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: "Proxy: " + e.message }));
            }
        });
        return;
    }
    if (req.method === "GET" && req.url === "/session") {
        const t = (req.headers.authorization || "").replace("Bearer ", "");
        res.writeHead(tokens.has(t) ? 200 : 401);
        return res.end();
    }
    const entry = req.method === "GET" && FILES[req.url.split("?")[0]];
    if (!entry) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": entry[1], "Cache-Control": "no-store" });
    fs.createReadStream(path.join(__dirname, entry[0])).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
    console.log(`Editor local: http://127.0.0.1:${PORT}  (API: ${API_BASE})`);
});
