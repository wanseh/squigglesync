import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import apiRouter from './api';
import { setupWebSocket } from './setup/websocket.setup';
import { setupLogger } from './utils/logger.util';
import { logMiddleware } from './middleware/log.middleware';

dotenv.config();

// Setup automatic timestamp logging for all console methods
setupLogger();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Non-API routes (health, status, etc.)
app.get('/health', logMiddleware, (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// API routes
app.use('/api', apiRouter);

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server
setupWebSocket(server);

// Start server
server.listen(PORT, () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    console.log(`API endpoints: http://localhost:${PORT}/api`);
});