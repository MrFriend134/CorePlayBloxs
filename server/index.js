import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { authRouter } from './routes/auth.js';
import { economyRouter } from './routes/economy.js';
import { adminRouter } from './routes/admin.js';
import { usersRouter } from './routes/users.js';
import { gamesRouter } from './routes/games.js';
import { initSocketHandlers } from './socket/index.js';
import { loadDataStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const isProduction = process.env.NODE_ENV === 'production' || existsSync(clientDist);

const app = express();
const httpServer = createServer(app);

const corsOrigins = isProduction ? true : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const io = new Server(httpServer, {
  cors: { origin: corsOrigins, credentials: true },
  transports: ['websocket', 'polling']
});

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

loadDataStore().then(() => {
  app.use('/api/auth', authRouter);
  app.use('/api/economy', economyRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/games', gamesRouter);

  app.get('/api/health', (_, res) => res.json({ ok: true }));

  if (isProduction) {
    app.use(express.static(clientDist));
    app.get('*', (_, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  initSocketHandlers(io);

  const PORT = process.env.PORT || (isProduction ? 3000 : 3001);
  httpServer.listen(PORT, () => {
    console.log(`CorePlayBlox server: http://localhost:${PORT}${isProduction ? ' (production)' : ''}`);
  });
}).catch(err => console.error('Store init failed:', err));
