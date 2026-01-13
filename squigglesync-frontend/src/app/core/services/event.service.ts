import { Injectable, inject } from '@angular/core';
import { WhiteboardStore } from '../store/whiteboard.store';
import { UserStore } from '../store/user.store';
import type { 
  WhiteboardEvent, 
  DrawLineEvent, 
  EraseEvent, 
  ClearCanvasEvent 
} from '../models/events.model';
import type { RoomJoinedMessage, EventMessage } from '../models/server-message.model';
import { isRoomJoinedMessage, isEventMessage } from '../models/server-message.model';
/**
 * EventService
 * 
 * PURPOSE: Processes and creates whiteboard events
 * 
 * WHY IT MATTERS:
 * This service handles the business logic for events:
 * - Creates events from user actions (drawing, erasing, clearing)
 * - Processes incoming events from server
 * - Validates events before adding to store
 * - Updates WhiteboardStore signals reactively
 * 
 * HOW IT WORKS:
 * 1. User draws → createDrawLineEvent() called → Returns event
 * 2. Event sent via WebSocketService
 * 3. Server processes and broadcasts → EVENT message received
 * 4. processMessage() called → Validates and adds to WhiteboardStore
 * 5. WhiteboardStore signals update → Canvas renders reactively
 * 
 * EXAMPLE FLOW:
 * 
 * User draws line → createDrawLineEvent() creates event
 *   ↓
 * Event sent to server via WebSocketService.send()
 *   ↓
 * Server processes and broadcasts → EVENT message received
 *   ↓
 * processMessage() validates event
 *   ↓
 * WhiteboardStore.addEvent() called
 *   ↓
 * Canvas renders from updated events signal
 */

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private whiteboardStore = inject(WhiteboardStore);
  private userStore = inject(UserStore);

  /**
   * Process an incoming server message
   * 
   * Handles ROOM_JOINED and EVENT messages from server.
   * Updates WhiteboardStore signals accordingly.
   * 
   * @param message - The server message to process (ROOM_JOINED or EVENT)
   * 
   * Example:
   * processMessage({ type: 'ROOM_JOINED', payload: { roomId: 'room-123', state: [...], userCount: 2 } })
   * → Sets room in WhiteboardStore
   * → Sets user count
   * → Clears existing events
   * → Adds state snapshot events
   */
  processMessage(message: RoomJoinedMessage | EventMessage): void {
    if (isRoomJoinedMessage(message)) {
      this.handleRoomJoined(message.payload);
    } else if (isEventMessage(message)) {
      this.handleIncomingEvent(message.payload);
    } else {
      console.warn('Unknown message type:', message);
    }
  }

  /**
   * Handle ROOM_JOINED message - set room state
   * 
   * Called when client successfully joins a room.
   * Receives current room state (all events) and user count.
   * 
   * @param message - The ROOM_JOINED message
   * 
   * Example:
   * handleRoomJoined({ type: 'ROOM_JOINED', payload: { roomId: 'room-123', state: [event1, event2], userCount: 2 } })
   * → Sets currentRoom to 'room-123'
   * → Sets userCount to 2
   * → Clears existing events
   * → Adds state events to store
   */
  private handleRoomJoined(payload: RoomJoinedMessage['payload']): void {
    const { roomId, state, userCount } = payload;

    this.whiteboardStore.setRoom(roomId);
    this.whiteboardStore.setUserCount(userCount);
  
    // Replace all events with state snapshot
    this.whiteboardStore.clearEvents();
    this.whiteboardStore.addEvents(state);
  }

  private handleIncomingEvent(event: EventMessage['payload']): void {
    // Validate event
    if (!this.validateEvent(event)) {
      console.warn('Invalid event received:', event);
      return;
    }

    // Add to store (store handles deduplication)
    this.whiteboardStore.addEvent(event);
  }

  /**
   * Create a DRAW_LINE event
   * 
   * Creates a draw line event from user drawing action.
   * Uses current userId and roomId from stores.
   * 
   * @param points - Array of [x, y] coordinate pairs
   * @param color - The stroke color (hex string)
   * @param strokeWidth - The stroke width in pixels
   * @returns A DrawLineEvent object
   * 
   * Example:
   * createDrawLineEvent([[0, 0], [100, 100]], '#FF0000', 3)
   * → Returns { type: 'DRAW_LINE', userId: 'user-123', roomId: 'room-456', points: [...], color: '#FF0000', strokeWidth: 3, timestamp: ... }
   */
  createDrawLineEvent(
    points: [number, number][], 
    color: string, 
    strokeWidth: number
  ): DrawLineEvent {
    return {
      type: 'DRAW_LINE',
      userId: this.userStore.userId(),
      roomId: this.whiteboardStore.currentRoom() || '',
      points,
      color,
      strokeWidth,
      timestamp: Date.now()
    }
  }

  /**
   * Create an ERASE event
   * 
   * Creates an erase event for a rectangular region.
   * 
   * @param region - The rectangular region to erase { x, y, width, height }
   * @returns An EraseEvent object
   * 
   * Example:
   * createEraseEvent({ x: 10, y: 10, width: 50, height: 50 })
   * → Returns { type: 'ERASE', userId: 'user-123', roomId: 'room-456', region: {...}, timestamp: ... }
   */
  createEraseEvent(region: { x: number; y: number; width: number; height: number }): EraseEvent {
    return {
      type: 'ERASE',
      userId: this.userStore.userId(),
      roomId: this.whiteboardStore.currentRoom() || '',
      region,
      timestamp: Date.now()
    }
  }

  /**
   * Create a CLEAR_CANVAS event
   * 
   * Creates a clear canvas event to clear the entire whiteboard.
   * 
   * @returns A ClearCanvasEvent object
   * 
   * Example:
   * createClearCanvasEvent()
   * → Returns { type: 'CLEAR_CANVAS', userId: 'user-123', roomId: 'room-456', timestamp: ... }
   */
  createClearCanvasEvent(): ClearCanvasEvent {
    return {
      type: 'CLEAR_CANVAS',
      userId: this.userStore.userId(),
      roomId: this.whiteboardStore.currentRoom() || '',
      timestamp: Date.now()
    }
  }

  /**
   * Validate an event before processing
   * 
   * Checks that event has required fields and valid structure.
   * 
   * @param event - The event to validate
   * @returns True if event is valid, false otherwise
   * 
   * Example:
   * validateEvent({ type: 'DRAW_LINE', points: [[0,0]], color: '#FF0000', strokeWidth: 3, ... })
   * → Checks type, userId, roomId, timestamp exist
   * → Checks DRAW_LINE has points array, color, strokeWidth
   * → Returns true if all valid
   */
  private validateEvent(event: WhiteboardEvent): boolean {
    if (!event.type || !event.userId || !event.roomId || !event.timestamp) {
      return false;
    }

    switch (event.type) {
      case 'DRAW_LINE':
        return Array.isArray(event.points) && 
               event.points.length > 0 &&
               typeof event.color === 'string' &&
               typeof event.strokeWidth === 'number';
      
      case 'DRAW_PATH':
        return Array.isArray(event.path) && 
               event.path.length > 0 &&
               typeof event.color === 'string' &&
               typeof event.strokeWidth === 'number';
      
      case 'ERASE':
        return event.region &&
               typeof event.region.x === 'number' &&
               typeof event.region.y === 'number' &&
               typeof event.region.width === 'number' &&
               typeof event.region.height === 'number';
      
      case 'CLEAR_CANVAS':
        return true;
      
      default:
        return false;
    }
  }
}
