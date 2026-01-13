import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ConnectionStore } from '../store/connection.store';
import type { ServerMessage } from '../models/server-message.model';
import {
  isConnectedMessage,
  isRoomJoinedMessage,
  isEventMessage,
  isErrorMessage
} from '../models/server-message.model';

/**
 * WebSocketService
 * 
 * PURPOSE: Manages WebSocket connection and message handling
 * 
 * WHY IT MATTERS:
 * This is the bridge between the frontend and backend WebSocket server.
 * It handles connection lifecycle, message sending/receiving, and automatic
 * reconnection. Updates ConnectionStore signals reactively.
 * 
 * HOW IT WORKS:
 * 1. connect() → Creates WebSocket connection
 * 2. Server sends CONNECTED → Updates ConnectionStore
 * 3. Client sends JOIN_ROOM → Server responds with ROOM_JOINED
 * 4. Client sends events → Server broadcasts to room
 * 5. Server sends EVENT → Client receives and processes
 * 6. On disconnect → Attempts reconnection with exponential backoff
 * 
 * EXAMPLE FLOW:
 * 
 * connect() called
 *   ↓
 * WebSocket connects → CONNECTED message received
 *   ↓
 * ConnectionStore.setConnected(sessionId) called
 *   ↓
 * joinRoom('room-123', 'user-456') called
 *   ↓
 * ROOM_JOINED message received → EventService processes it
 *   ↓
 * Events flow through messages$ observable
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private connectionStore = inject(ConnectionStore);
  
  private webSocket: WebSocket | null = null;
  private messageSubject = new Subject<ServerMessage>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  // Public observable for messages
  readonly messages$: Observable<ServerMessage> = this.messageSubject.asObservable();

  // Filtered observables for specific message types
  readonly connected$ = this.messages$.pipe(
    filter(isConnectedMessage)
  );

  readonly roomJoined$ = this.messages$.pipe(
    filter(isRoomJoinedMessage)
  );

  readonly events$ = this.messages$.pipe(
    filter(isEventMessage)
  );

  readonly errors$ = this.messages$.pipe(
    filter(isErrorMessage)
  );

  /**
   * Connect to WebSocket server
   * 
   * Creates a new WebSocket connection and sets up event handlers.
   * Updates ConnectionStore signals as connection state changes.
   * 
   * Example:
   * connect()
   * → Sets connectionStatus to 'connecting'
   * → Creates WebSocket connection to environment.wsUrl
   * → Sets up onopen, onmessage, onerror, onclose handlers
   * → On success: Updates ConnectionStore to 'connected'
   */
  connect(): void {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isManualDisconnect = false;
    this.connectionStore.setConnecting();

    try {
      this.webSocket = new WebSocket(environment.wsUrl);

      this.webSocket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.webSocket.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.connectionStore.setError('Invalid message format');
        }
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStore.setError('WebSocket connection error');
      };

      this.webSocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStore.setDisconnected();
        this.webSocket = null;

        // Attempt reconnection if not manual disconnect
        if (!this.isManualDisconnect) {
          this.attemptReconnect();
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connectionStore.setError('Failed to create WebSocket connection');
    }
  }

  /**
   * Send a message to the server
   * 
   * Serializes the message to JSON and sends it via WebSocket.
   * Only sends if WebSocket is in OPEN state.
   * 
   * @param message - The message object to send (will be JSON stringified)
   * 
   * Example:
   * send({ type: 'JOIN_ROOM', roomId: 'room-123', userId: 'user-456' })
   * → Checks if WebSocket is open
   * → Sends JSON stringified message
   * → If not open: Sets error in ConnectionStore
   */
  send(message: unknown): void {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
      this.connectionStore.setError('Cannot send message: not connected');
    }
  }

  /**
   * Disconnect from WebSocket server
   * 
   * Closes the WebSocket connection and prevents automatic reconnection.
   * 
   * Example:
   * disconnect()
   * → Sets isManualDisconnect to true
   * → Clears reconnection timer
   * → Closes WebSocket connection
   * → Updates ConnectionStore to 'disconnected'
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    this.connectionStore.setDisconnected();
  }

  /**
   * Join a room
   * 
   * Sends a JOIN_ROOM message to the server.
   * Server will respond with ROOM_JOINED message containing room state.
   * 
   * @param roomId - The room identifier
   * @param userId - The user identifier
   * 
   * Example:
   * joinRoom('room-123', 'user-456')
   * → Sends { type: 'JOIN_ROOM', roomId: 'room-123', userId: 'user-456', timestamp: ... }
   * → Server responds with ROOM_JOINED message
   */
  joinRoom(roomId: string, userId: string): void {
    this.send({
      type: 'JOIN_ROOM',
      roomId,
      userId,
      timestamp: Date.now()
    });
  }

  /**
   * Leave a room
   * 
   * Sends a LEAVE_ROOM message to the server.
   * 
   * @param roomId - The room identifier
   * @param userId - The user identifier
   * 
   * Example:
   * leaveRoom('room-123', 'user-456')
   * → Sends { type: 'LEAVE_ROOM', roomId: 'room-123', userId: 'user-456', timestamp: ... }
   */
  leaveRoom(roomId: string, userId: string): void {
    this.send({
      type: 'LEAVE_ROOM',
      roomId,
      userId,
      timestamp: Date.now()
    });
  }

  private handleMessage(message: ServerMessage): void {
    this.messageSubject.next(message);

    if (isConnectedMessage(message)) {
      this.connectionStore.setConnected(message.payload.sessionId);
    } else if (isErrorMessage(message)) {
      this.connectionStore.setError(message.error);
    }
    // ROOM_JOINED and EVENT messages are handled by EventService
  }

  /**
   * Attempt to reconnect with exponential backoff
   * 
   * Automatically attempts to reconnect when connection is lost.
   * Uses exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s).
   * Stops after maxReconnectAttempts (5) attempts.
   * 
   * Example:
   * attemptReconnect()
   * → Checks if max attempts reached
   * → Increments reconnectAttempts
   * → Calculates new delay (exponential backoff)
   * → Schedules reconnect() call after delay
   * → On 5th failure: Sets error in ConnectionStore
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionStore.setError('Failed to reconnect after multiple attempts');
      return;
    }

    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }
}
