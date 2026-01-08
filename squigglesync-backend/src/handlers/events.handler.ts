import { WhiteboardEvent } from '../types/events';
import { RoomStateService } from '../services/room-state.service';
import { validateEvent, sanitizeEvent } from '../utils/validation.util';
/**
 * EventsHandler
 * 
 * PURPOSE: Business logic for event processing
 * 
 * This sits between the API layer and the service layer.
 * It handles:
 * - Event validation
 * - Event sanitization
 * - Calling RoomState to process events
 * - Error handling
 */
export class EventsHandler {
    private roomStateService: RoomStateService;

    constructor(roomStateService: RoomStateService) {
        this.roomStateService = roomStateService;
    }

    /**
     * Handle event submission
     * @param roomId - The room ID
     * @param event - The event to submit
     * @returns The result of the event submission
     * 
     * Example:
     * handleEventSubmission('room-123', { type: 'DRAW_LINE', userId: 'user-123', points: [[0,0], [100,100]] })
     * → Returns { success: true, event: { type: 'DRAW_LINE', userId: 'user-123', points: [[0,0], [100,100]] } }
     * 
     * Error:
     * 400 - Bad Request
     * 500 - Internal Server Error
     * 
     * Response:
     * { success: true, event: { type: 'DRAW_LINE', userId: 'user-123', points: [[0,0], [100,100]] } }
     * 
     */
    handleEventSubmission(roomId: string, event: WhiteboardEvent): { 
        success: boolean;
        event?: WhiteboardEvent;
        error?: string;
    } {
        if (!validateEvent(event)) {
            return {
                success: false,
                error: 'Invalid event structure'
            };
        }

        const sanitizedEvent = sanitizeEvent(event as WhiteboardEvent);
        const processedEvent = this.roomStateService.processEvent(roomId, sanitizedEvent);

        if (!processedEvent) {
            return {
                success: false,
                error: 'Event rejected due to conflict resolution'
            };
        }

        return {
            success: true,
            event: processedEvent
        };
    }

    /**
     * Handle event retrieval for a room
     * @param roomId - The room ID
     * @param afterSequence - The sequence number to start after
     * @returns The events after the sequence number
     * 
     * Example:
     * handleGetEvents('room-123', 10)
     * → Returns [event11, event12, event13]
     * 
     * Error:
     * 400 - Bad Request
     * 500 - Internal Server Error
     * 
     * Response:
     * { success: true, events: [event11, event12, event13] }
     * 
     */
    handleGetEvents(roomId:string, afterSequence?: number): WhiteboardEvent[] {
        if (afterSequence !== undefined) {
            return this.roomStateService.getEventsAfter(roomId, afterSequence);
        }

        return this.roomStateService.getState(roomId);
    }
}