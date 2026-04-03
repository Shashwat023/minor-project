// bridge/signaling-server.js
// WebRTC Signaling Server for MemoryCare
//
// SETUP (first time):
//   cd bridge
//   cp signaling-package.json package.json
//   npm install
//   node signaling-server.js          ← runs on port 4000
//
// This server is proxied through Vite (/socket.io → :4000).
// Guest connects via: wss://YOUR_NGROK/socket.io (same origin as the page).
// No second ngrok tunnel needed.

const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors    = require("cors");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Allow both WebSocket and long-polling — polling is fallback when WS blocked
  transports: ["websocket", "polling"],
  // Generous timeouts for ngrok tunnels (can add latency)
  pingTimeout:  60000,
  pingInterval: 25000,
  // Allow the ngrok-skip-browser-warning header through
  allowEIO3: true,
});

// rooms: Map<roomId, Set<socketId>>
const rooms = new Map();

app.get("/health", (_, res) => res.json({
  status: "ok",
  rooms: rooms.size,
  roomIds: [...rooms.keys()],
  uptime: Math.floor(process.uptime()),
}));

io.on("connection", (socket) => {
  console.log(`[sig] + connect  ${socket.id}`);

  // ── Join Room ──────────────────────────────────────────────────────────────
  socket.on("join-room", ({ roomId, peerId }) => {
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    const room = rooms.get(roomId);

    if (room.size >= 2) {
      socket.emit("room-full", { roomId });
      console.log(`[sig] room-full  ${roomId}  (rejected ${peerId})`);
      return;
    }

    const isHost = room.size === 0;
    room.add(socket.id);
    socket.join(roomId);
    socket.data.roomId  = roomId;
    socket.data.peerId  = peerId;
    socket.data.isHost  = isHost;

    console.log(`[sig] join  room=${roomId}  peer=${peerId}  role=${isHost ? "HOST" : "GUEST"}  size=${room.size}`);

    socket.emit("room-joined", { roomId, isHost, peerCount: room.size });

    if (!isHost) {
      // Tell host: guest arrived → create offer
      socket.to(roomId).emit("peer-joined", { peerId, socketId: socket.id });
      // Tell guest: room has someone in it (for UI)
      const hostId = [...room].find((id) => id !== socket.id);
      socket.emit("existing-peer", { socketId: hostId });
    }
  });

  // ── SDP Offer ──────────────────────────────────────────────────────────────
  socket.on("offer", ({ roomId, offer }) => {
    console.log(`[sig] offer  room=${roomId}  from=${socket.id}`);
    socket.to(roomId).emit("offer", { offer, from: socket.id });
  });

  // ── SDP Answer ─────────────────────────────────────────────────────────────
  socket.on("answer", ({ roomId, answer }) => {
    console.log(`[sig] answer  room=${roomId}  from=${socket.id}`);
    socket.to(roomId).emit("answer", { answer, from: socket.id });
  });

  // ── ICE Candidate ──────────────────────────────────────────────────────────
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    const { roomId, peerId } = socket.data;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(socket.id);
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`[sig] room deleted  room=${roomId}`);
      } else {
        socket.to(roomId).emit("peer-left", { peerId });
        console.log(`[sig] peer-left  room=${roomId}  peer=${peerId}`);
      }
    }
    console.log(`[sig] - disconnect  ${socket.id}  (${reason})`);
  });
});

server.listen(PORT, () => {
  console.log(`\n[sig] MemoryCare Signaling Server  →  http://localhost:${PORT}`);
  console.log(`[sig] health: http://localhost:${PORT}/health\n`);
});
