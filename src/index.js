// import express from 'express';
// import dotenv from 'dotenv';
// import authRouter from './router/api.auth.js';
// import songRouter from './router/song.router.js';
// import connectDB from './lib/db.js';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';

// dotenv.config()

// const app = express();
// connectDB();

// const HOST = 'localhost';
// const PORT = process.env.PORT;
// app.use(cors({
//     origin: (origin, callback) => {
//         if (!origin) return callback(null, true);
//         callback(null, origin);
//     },
//     credentials: true
// }));
// app.use(express.json());
// app.use(cookieParser());

// app.use('/api', authRouter);

// app.use('/song', songRouter);

// app.listen(PORT, HOST, ()=>{
//     console.log(`Server is running on port ${PORT}`);
// })


import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import connectDB from './lib/db.js';
import authRouter from './router/api.auth.js';
import songRouter from './router/song.router.js';

dotenv.config();

// --- Express app and HTTP server setup ---
const app = express();
const server = http.createServer(app);

// --- Socket.io setup ---
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// --- MongoDB connection ---
connectDB();

// --- Middlewares ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, origin);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use('/api', authRouter);
app.use('/song', songRouter);

// --- Socket.io signaling logic ---
const rooms = {}; // Track room users

io.on('connection', socket => {
  console.log('🟢 New user connected:', socket.id);

  // Join a room
  socket.on('join-room', ({ roomId, password }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    console.log(`📥 ${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit('user-joined', socket.id);
  });

  // WebRTC signaling (if needed)
  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { sender: socket.id, data });
  });

  // 🔊 Broadcast song to room
  socket.on('broadcast-song', ({ roomId, songUrl }) => {
    console.log(`🎶 Broadcasting song to room ${roomId}`);
    socket.to(roomId).emit('receive-song', { songUrl });
    socket.emit("receive-song", { songUrl });
  });

  // ▶️ Play song in room
  socket.on('play-song', ({ roomId }) => {
    console.log(`▶️ Play song in room ${roomId}`);
    socket.to(roomId).emit('play-song');
  });

  // ⏸️ Pause song in room
  socket.on('pause-song', ({ roomId }) => {
    console.log(`⏸️ Pause song in room ${roomId}`);
    socket.to(roomId).emit('pause-song');
  });

  // Disconnect logic
  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});

