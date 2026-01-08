import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomStateService } from '../services/room-state.service';
import { WebSocketRoomsService } from '../services/websocket-rooms.service';
import { WebSocketHandler } from '../handlers/websocket.handler';

/**
 * Setup WebSocket server and services
 * 
 * @param httpServer - The HTTP server instance
 * @returns The WebSocket server instance
 */
export function setupWebSocket(httpServer: Server): WebSocketServer {
    // Initialize services
    const roomStateService = new RoomStateService();
    const websocketRoomsService = new WebSocketRoomsService();
    const websocketHandler = new WebSocketHandler(roomStateService, websocketRoomsService);

    // Create WebSocket server
    const webSocketServer = new WebSocketServer({ server: httpServer });

    // Handle WebSocket connections
    webSocketServer.on('connection', (socket: WebSocket) => {
        websocketHandler.handleConnection(socket);
    });

    return webSocketServer;
}

