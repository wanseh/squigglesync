/**
 * WebSocket Server Message Models
 * Type-safe server message definitions matching backend structure
 */

import type { WhiteboardEvent } from './events.model';

/**
 * Server message type discriminator
 */
export type ServerMessageType = 'CONNECTED' | 'ROOM_JOINED' | 'ERROR' | 'EVENT';

/**
 * CONNECTED message sent when WebSocket connection is established
 * @example { type: 'CONNECTED', payload: { sessionId: 'uuid', message: 'Connected to SquiggleSync Server' } }
 */
export interface ConnectedMessage {
  type: 'CONNECTED';
  payload: {
    sessionId: string;
    message: string;
  };
}

/**
 * ROOM_JOINED message sent after client successfully joins a room
 * Contains the current state of the room (all events)
 * @example { type: 'ROOM_JOINED', payload: { roomId: 'room-123', userCount: 3, state: [...], stateEventCount: 10 } }
 */
export interface RoomJoinedMessage {
  type: 'ROOM_JOINED';
  payload: {
    roomId: string;
    userCount: number;
    state: WhiteboardEvent[];
    stateEventCount: number;
  };
}

/**
 * EVENT message sent when a whiteboard event is processed and broadcast
 * @example { type: 'EVENT', payload: { type: 'DRAW_LINE', ... } }
 */
export interface EventMessage {
  type: 'EVENT';
  payload: WhiteboardEvent;
}

/**
 * ERROR message sent when an error occurs
 * @example { type: 'ERROR', error: 'Invalid event format' }
 */
export interface ErrorMessage {
  type: 'ERROR';
  error: string;
}

/**
 * Union type of all possible server messages
 * Use type guards to narrow the type
 */
export type ServerMessage =
  | ConnectedMessage
  | RoomJoinedMessage
  | EventMessage
  | ErrorMessage;

/**
 * Type guard to check if a message is a ConnectedMessage
 */
export function isConnectedMessage(
  message: ServerMessage
): message is ConnectedMessage {
  return message.type === 'CONNECTED';
}

/**
 * Type guard to check if a message is a RoomJoinedMessage
 */
export function isRoomJoinedMessage(
  message: ServerMessage
): message is RoomJoinedMessage {
  return message.type === 'ROOM_JOINED';
}

/**
 * Type guard to check if a message is an EventMessage
 */
export function isEventMessage(
  message: ServerMessage
): message is EventMessage {
  return message.type === 'EVENT';
}

/**
 * Type guard to check if a message is an ErrorMessage
 */
export function isErrorMessage(
  message: ServerMessage
): message is ErrorMessage {
  return message.type === 'ERROR';
}

