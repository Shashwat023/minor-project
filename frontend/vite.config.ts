import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PROXY STRATEGY — single Cloudflare tunnel, zero cross-origin issues:
//
//   Browser (any device)                           Your machine
//   ─────────────────────                          ─────────────
//   GET  /api/summary    ──► CF tunnel ──► :5173 ──► LLM  :8001
//   POST /api/audio      ──► CF tunnel ──► :5173 ──► LLM  :8001
//   WS   /socket.io      ──► CF tunnel ──► :5173 ──► Sig  :4000
//   POST /ml/snapshot    ──► CF tunnel ──► :5173 ──► ML   :8002
//
// Run ONE tunnel only:
//   cloudflared tunnel --url http://localhost:5173
//
// Vite forwards everything to the right local service.
// No CORS. No hardcoded URLs. No second tunnel needed.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,         // expose on LAN (0.0.0.0)
    allowedHosts: true, // accept any hostname — required for CF/ngrok tunnel domains
    proxy: {
      // ── LLM service: audio transcription, summaries, session end, RAG ──
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },

      // ── ML service: snapshot saving ──
      // /ml/snapshot → http://localhost:8002/snapshot  (strips /ml prefix)
      "/ml": {
        target: "http://localhost:8002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml/, ""),
      },

      // ── WebRTC signaling over WebSocket ──
      // ws:true enables the HTTP → WebSocket upgrade proxy
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5173, host: true },
});
