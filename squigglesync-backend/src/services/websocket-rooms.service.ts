import { WebSocket } from 'ws';
/**
 * WebSocketRoomsService
 * 
 * PURPOSE: Manages WebSocket connections per room
 * 
 * WHY IT MATTERS:
 * We need to track which WebSocket connections belong to which rooms
 * so we can broadcast events to the right clients.
 * 
 * HOW IT WORKS:
 * - Each room has a Set of WebSocket connections
 * - When a client joins a room, we add their WebSocket to that room's set
 * - When broadcasting, we send to all WebSockets in that room
 * 
 * EXAMPLE:
 * Client A connects → joins room-1 → WebSocket added to room-1's set
 * Client B connects → joins room-1 → WebSocket added to room-1's set
 * Event arrives for room-1 → Broadcast to both Client A and Client B
 */
export class WebSocketRoomsService {
    // roomId -> Set of WebSocket connections
    private rooms: Map<string, Set<WebSocket>> = new Map();
    // WebSocket -> roomId
    private clientRooms: Map<WebSocket, string> = new Map();

   /**
     * Add a WebSocket connection to a room
     * 
     * @param roomId - The room identifier
     * @param socket - The WebSocket connection
     * 
     * Example:
     * joinRoom("room-1", socket)
     * → Adds socket to room-1's Set
     * → Updates clientRooms Map
     * → Logs: "Client joined room room-1. 1 clients in room."
     */
    joinRoom(roomId: string, socket: WebSocket): void {
        // grab the previous room the client was in
        const previousRoom = this.clientRooms.get(socket);
        if (previousRoom) {
            this.leaveRoom(previousRoom, socket);
        }

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        const roomConnections = this.rooms.get(roomId)!;
        roomConnections.add(socket);
        this.clientRooms.set(socket, roomId);
        console.log(`Client joined room ${roomId}. ${roomConnections.size} clients in room.`);
    }
    
    /**
     * Remove a WebSocket connection from a room
     * 
     * @param roomId - The room identifier
     * @param ws - The WebSocket connection
     */
    leaveRoom(roomId: string, socket: WebSocket): void {
        const roomConnections = this.rooms.get(roomId);
        if (roomConnections) {
            roomConnections.delete(socket);
            console.log(`Client left room ${roomId}. ${roomConnections.size} clients remaining.`);

            if (roomConnections.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        this.clientRooms.delete(socket);
    }

    /**
     * Get the WebSocket connections for a room
     * 
     * @param roomId - The room identifier
     * @returns The Set of WebSocket connections for the room
     */
    getRoomConnections(roomId: string): Set<WebSocket> {
        return this.rooms.get(roomId) || new Set();
    }

    /**
     * Broadcast a message to all clients in a room
     * 
     * @param roomId - The room identifier
     * @param message - The message to broadcast (will be JSON stringified)
     * @param excludeSocket - Optional: exclude this WebSocket from broadcast
     * 
     * Example:
     * broadcastToRoom("room-1", { type: "DRAW_LINE", points: [[10, 10], [20, 20]] })
     * → Sends message to all clients in room-1
     * → Logs: "Broadcast to room room-1: 2 clients."
     */
    broadcastToRoom(roomId: string, message: any, excludeSocket?: WebSocket): void {
        const connections = this.getRoomConnections(roomId);
        const data = JSON.stringify(message);

        let sentCount = 0;
        connections.forEach((ws) => {
            // skip the socket we're excluding
            if (ws === excludeSocket) return;

            // only send to open sockets
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
                sentCount++;
            }
        })

        console.debug(`Broadcast to room ${roomId}: ${sentCount} clients.`); 
    }

    /**
     * Remove a client from all rooms and close the WebSocket connection
     * 
     * @param socket - The WebSocket connection
     * 
     * Example:
     * removeClient(socket)
     * → Removes socket from all rooms
     * → Closes socket connection
     * → Logs: "Client disconnected. Removed from all rooms."
     */
    removeClient(socket: WebSocket): void {
        const roomId = this.clientRooms.get(socket);
        if (roomId) {
            this.leaveRoom(roomId, socket);
        }
    }

    /**
     * Get the room ID for a WebSocket connection
     * 
     * @param socket - The WebSocket connection
     * @returns The room ID for the WebSocket connection
     * 
     * Example:
     * getClientRoom(socket)
     * → Returns "room-1" if socket is in room-1
     * → Returns undefined if socket is not in any room
     */
    getClientRoom(socket: WebSocket): string | undefined {
        return this.clientRooms.get(socket);
    }
}