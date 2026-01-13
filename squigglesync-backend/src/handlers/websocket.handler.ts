import { WebSocket } from 'ws';
import { WhiteboardEvent, ServerMessage } from '../types/events';
import { RoomStateService } from '../services/room-state.service';
import { WebSocketRoomsService } from '../services/websocket-rooms.service';
import { validateEvent, sanitizeEvent } from '../utils/validation.util';
import { v4 as uuidv4 } from 'uuid';
/**
 * WebSocketHandler
 * 
 * PURPOSE: Handles WebSocket connections and message processing
 * 
 * WHY IT MATTERS:
 * This is the bridge between WebSocket connections and our existing
 * RoomState service. It:
 * - Manages WebSocket lifecycle (connect, disconnect)
 * - Processes incoming events
 * - Broadcasts events to room participants
 * - Sends state snapshots to new clients
 * 
 * HOW IT WORKS:
 * 1. Client connects → Assign session ID
 * 2. Client sends JOIN_ROOM → Add to room, send current state
 * 3. Client sends DRAW_LINE → Process through RoomState, broadcast to room
 * 4. Client disconnects → Cleanup
 */
export class WebSocketHandler {
    private roomState: RoomStateService;
    private websocketRooms: WebSocketRoomsService;

    // WebSocket -> sessionId
    private sessions: Map<WebSocket, string> = new Map();

    constructor(roomState: RoomStateService, websocketRooms: WebSocketRoomsService) {
        this.roomState = roomState;
        this.websocketRooms = websocketRooms;
    }

    /**
     *  
     * Handle a new WebSocket connection
     * 
     * @param socket - The WebSocket connection
     * 
     * Example:
     * handleConnection(socket)
     * → Creates a new session ID
     * → Sends CONNECTED message to client
     * → Logs: "New WebSocket connection: { sessionId }"
     * → Logs: "Sent message to WebSocket: { type: 'CONNECTED', payload: { sessionId } }"
     */
    handleConnection(socket: WebSocket): void {
        const sessionId = uuidv4();
        this.sessions.set(socket, sessionId);

        console.log(`New WebSocket connection: ${sessionId}`);

        this.sendMessage(socket, {
            type: 'CONNECTED',
            payload: {
                sessionId,
                message: 'Connected to SquiggleSync Server'
            }
        })

        // handle incoming messages
        socket.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(socket, message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                this.sendError(socket, 'Invalid message format');
            }
        })

        // handle disconnection
        socket.on('close', () => {
            console.log(`WebSocket disconnected: ${sessionId}`);
            this.handleDisconnection(socket);
        })

        // handle errors
        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.handleDisconnection(socket);
        })
    }

    private handleMessage(socket: WebSocket, message: any): void {
        const startTime = Date.now();
        
        if (!message.type) {
            this.sendError(socket, 'Message type is required');
            return;
        }

        console.debug(`Received message: ${message.type}`);

        switch (message.type) {
            case 'JOIN_ROOM':
                this.handleJoinRoom(socket, message);
                break;
            case 'LEAVE_ROOM':
                this.handleLeaveRoom(socket, message);
                break;
            case 'DRAW_LINE':
            case 'DRAW_PATH':
            case 'ERASE':
            case 'CLEAR_CANVAS':
                this.handleWhiteboardEvent(socket, message);
                break;
            default:
                console.warn(`Unknown message type: ${message.type}`);
                this.sendError(socket, `Unknown message type: ${message.type}`);
        }
        
        const duration = Date.now() - startTime;
        console.debug(`Processed message: ${message.type} (${duration}ms)`);
    }

    /**
     * 
     * Handle a whiteboard event
     * 
     * @param socket - The WebSocket connection
     * @param message - The message to handle
     * 
     * Example:
     * handleWhiteboardEvent(socket, { type: 'DRAW_LINE', payload: { points: [[0,0], [100,100]], color: 'red', strokeWidth: 2 } })
     * → Processes the event through RoomState
     * → Broadcasts the event to all clients in the room
     * → Logs: "Processed event: DRAW_LINE in room { roomId }"
     */
    private handleWhiteboardEvent(socket: WebSocket, message: any): void {
        const startTime = Date.now();
        
        const roomId = this.websocketRooms.getClientRoom(socket);
        if (!roomId) {
            console.warn('Event received but client not in a room');
            this.sendError(socket, 'Not in a room');
            return;
        }

        // Normalize incoming message into a full WhiteboardEvent shape
        // so that validateEvent() sees all required base fields.
        const candidateEvent: any = {
            ...message,
            roomId,
            // server is the source of truth for timestamps
            timestamp: Date.now(),
        };

        if (!validateEvent(candidateEvent)) {
            console.error('Invalid event received:', candidateEvent);
            this.sendError(socket, 'Invalid event');
            return;
        }

        const event: WhiteboardEvent = {
            ...sanitizeEvent(candidateEvent),
            roomId: candidateEvent.roomId,
            timestamp: candidateEvent.timestamp,
        };

        // Process event through RoomState
        // This handles conflict resolution and storage
        const processedEvent = this.roomState.processEvent(roomId, event);

        if (!processedEvent) {
            console.warn(`Event rejected due to conflict resolution: ${event.type} in room ${roomId}`);
            this.sendError(socket, 'Event rejected due to conflict resolution');
            return;
        }

        // Broadcast processed event to all clients in room
        // This includes the sender (for consistency)

        this.websocketRooms.broadcastToRoom(roomId, {
            type: 'EVENT',
            payload: processedEvent
        });

        const duration = Date.now() - startTime;
        console.debug(`Processed event: ${processedEvent.type} in room ${roomId} (${duration}ms)`);
    }

    /**
     * 
     * Handle a leave room message
     * 
     * @param socket - The WebSocket connection
     * @param message - The message to handle
     * 
     * Example:
     * handleLeaveRoom(socket, { type: 'LEAVE_ROOM', payload: { roomId } })
     * → Leaves the client from the room
     * → Logs: "Client left room { roomId }."
     */
    private handleLeaveRoom(socket: WebSocket, message: any): void {
        const roomId = this.websocketRooms.getClientRoom(socket);

        if (roomId) {
            this.websocketRooms.leaveRoom(roomId, socket);
            console.log(`Client left room ${roomId}.`);
        }
    }

    /**
     * 
     * Handle a join room message
     * 
     * @param socket - The WebSocket connection
     * @param message - The message to handle
     * 
     * Example:
     * handleJoinRoom(socket, { type: 'JOIN_ROOM', payload: { roomId, userId } })
     * → Joins the client to the room
     * → Logs: "Client { userId } joined room { roomId }."
     */
    private handleJoinRoom(socket: WebSocket, message: any): void {
        const startTime = Date.now();
        const { roomId, userId } = message;

        if (!roomId) {
            this.sendError(socket, 'Room ID is required');
            return;
        }

        this.websocketRooms.joinRoom(roomId, socket);

        const state = this.roomState.getState(roomId);
        const connections = this.websocketRooms.getRoomConnections(roomId);

        this.sendMessage(socket, {
            type: 'ROOM_JOINED',
            payload: {
                roomId,
                userCount: connections.size,
                state,
                stateEventCount: state.length
            }
        })

        const duration = Date.now() - startTime;
        console.log(`Client ${userId} joined room ${roomId}. ${connections.size} clients in room. (${duration}ms)`);
    }

    private handleDisconnection(socket: WebSocket): void {
        const sessionId = this.sessions.get(socket);
        this.websocketRooms.removeClient(socket);
        this.sessions.delete(socket);
        console.log(`WebSocket disconnected: ${sessionId || 'unknown'}`);
    }


    /**
     * 
     * Send a message to a WebSocket connection
     * 
     * @param socket - The WebSocket connection
     * @param message - The message to send
     * 
     * Example:
     * sendMessage(socket, { type: 'CONNECTED', payload: { sessionId } })
     * → Sends message to socket if it is open
     * → Logs: "Sent message to WebSocket: { type: 'CONNECTED', payload: { sessionId } }"
     */
    private sendMessage(socket: WebSocket, message: ServerMessage): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }

    /**
     * Send an error message to a WebSocket connection
     * 
     * @param socket - The WebSocket connection
     * @param error - The error message
     * 
     * Example:
     * sendError(socket, 'Invalid message format')
     * → Sends error message to socket if it is open
     * → Logs: "Sent error message to WebSocket: { type: 'ERROR', error: 'Invalid message format' }"
     */
    private sendError(socket: WebSocket, error: string): void {
        this.sendMessage(socket, {
            type: 'ERROR',
            error
        })
    }
}