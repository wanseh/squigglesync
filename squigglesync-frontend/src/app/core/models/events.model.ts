/**
 * Whiteboard Event Models
 * Matches backend event types for type safety
 * 
 * NOTE: These models are duplicated from the backend for frontend type safety.
 * Consider creating a shared package if both projects are in the same monorepo.
 */

/**
 * Base event interface that all whiteboard events extend
 */
export interface BaseEvent {
  type: string;
  userId: string;
  roomId: string;
  timestamp: number;
  sequence?: number;
}

/**
 * Draw a line between multiple points
 */
export interface DrawLineEvent extends BaseEvent {
  type: 'DRAW_LINE';
  points: [number, number][];
  color: string;
  strokeWidth: number;
}

/**
 * Draw a path (continuous line)
 */
export interface DrawPathEvent extends BaseEvent {
  type: 'DRAW_PATH';
  path: [number, number][];
  color: string;
  strokeWidth: number;
}

/**
 * Erase a rectangular region
 */
export interface EraseEvent extends BaseEvent {
  type: 'ERASE';
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Clear the entire canvas
 */
export interface ClearCanvasEvent extends BaseEvent {
  type: 'CLEAR_CANVAS';
}

/**
 * Join a room (sent by client to server)
 */
export interface JoinRoomEvent extends BaseEvent {
  type: 'JOIN_ROOM';
  roomId: string;
}

/**
 * Leave a room (sent by client to server)
 */
export interface LeaveRoomEvent extends BaseEvent {
  type: 'LEAVE_ROOM';
  roomId: string;
}

/**
 * Union type of all whiteboard events
 * Use type guards to narrow the type
 */
export type WhiteboardEvent =
  | DrawLineEvent
  | DrawPathEvent
  | EraseEvent
  | ClearCanvasEvent
  | JoinRoomEvent
  | LeaveRoomEvent;

/**
 * Type guard to check if an event is a DrawLineEvent
 */
export function isDrawLineEvent(
  event: WhiteboardEvent
): event is DrawLineEvent {
  return event.type === 'DRAW_LINE';
}

/**
 * Type guard to check if an event is a DrawPathEvent
 */
export function isDrawPathEvent(
  event: WhiteboardEvent
): event is DrawPathEvent {
  return event.type === 'DRAW_PATH';
}

/**
 * Type guard to check if an event is an EraseEvent
 */
export function isEraseEvent(event: WhiteboardEvent): event is EraseEvent {
  return event.type === 'ERASE';
}

/**
 * Type guard to check if an event is a ClearCanvasEvent
 */
export function isClearCanvasEvent(
  event: WhiteboardEvent
): event is ClearCanvasEvent {
  return event.type === 'CLEAR_CANVAS';
}

/**
 * Type guard to check if an event is a JoinRoomEvent
 */
export function isJoinRoomEvent(
  event: WhiteboardEvent
): event is JoinRoomEvent {
  return event.type === 'JOIN_ROOM';
}

/**
 * Type guard to check if an event is a LeaveRoomEvent
 */
export function isLeaveRoomEvent(
  event: WhiteboardEvent
): event is LeaveRoomEvent {
  return event.type === 'LEAVE_ROOM';
}

/**
 * Type guard to check if an event is a drawing event (DRAW_LINE or DRAW_PATH)
 */
export function isDrawingEvent(
  event: WhiteboardEvent
): event is DrawLineEvent | DrawPathEvent {
  return event.type === 'DRAW_LINE' || event.type === 'DRAW_PATH';
}

