import { WhiteboardEvent } from '../types/events';
import { ConflictResolverService } from './conflict-resolver.service';
import { EventStoreService } from './event-store.service';
import { SequenceManagerService } from './sequence-manager.service';
/**
 * RoomStateService
 * 
 * PURPOSE: Main coordinator that ties all services together
 * 
 * WHY IT MATTERS:
 * This is the single entry point for all state operations.
 * It coordinates:
 * - Event validation (via ConflictResolver)
 * - Event storage (via EventStore)
 * - Sequence management (via SequenceManager)
 * 
 * HOW IT WORKS:
 * 1. Client sends event
 * 2. RoomState.processEvent() is called
 * 3. Checks for conflicts (ConflictResolver)
 * 4. If no conflict, stores event (EventStore)
 * 5. Returns processed event with sequence number
 * 
 * EXAMPLE FLOW:
 * 
 * User draws line → processEvent() called
 *   ↓
 * Check conflicts → No conflicts found
 *   ↓
 * Store event → Sequence number assigned (e.g., 42)
 *   ↓
 * Return event with sequence 42
 * 
 * Another user draws at same time → processEvent() called
 *   ↓
 * Check conflicts → No conflicts found
 *   ↓
 * Store event → Sequence number assigned (e.g., 43)
 *   ↓
 * Return event with sequence 43
 * 
 * Both events stored in order: [event42, event43]
 */
export class RoomStateService {
    private eventStore: EventStoreService;
    private conflictResolver: ConflictResolverService;
    private activeRooms: Set<string> = new Set(); // We use set to avoid duplicates

    constructor() {
        const sequenceManager = new SequenceManagerService();
        this.eventStore = new EventStoreService(sequenceManager);
        this.conflictResolver = new ConflictResolverService();
    }

    /**
     * Process a new event (main entry point)
     * 
     * This is where all the concurrency magic happens:
     * 1. Check for conflicts
     * 2. If no conflict, store event
     * 3. Return processed event (with sequence number)
     * 
     * @param roomId - The room identifier
     * @param event - The event to process
     * @returns Processed event with sequence number, or null if rejected
     * 
     * EXAMPLE:
     * processEvent("room-1", drawLineEvent)
     *   → Checks conflicts → None found
     *   → Stores event → Gets sequence 1
     *   → Returns event with sequence: 1
     */
    processEvent(roomId: string, event: WhiteboardEvent): WhiteboardEvent | null {
        this.activeRooms.add(roomId);
        console.debug(`Room ${roomId} is now active`, Array.from(this.activeRooms));

        const existingEvents = this.eventStore.getEvents(roomId);
        const resolvedEvent = this.conflictResolver.resolveConflict(existingEvents, event);

        if (!resolvedEvent) {
            // We have a conflict, so we don't store the event so reject
            return null;
        }

        const processedEvent = this.eventStore.addEvent(roomId, resolvedEvent);

        return processedEvent;
    }

    /**
     * Get current state snapshot (all events in order)
     *
     * @param roomId - The room identifier
     * @returns The current state of the room
     */
    getState(roomId: string): WhiteboardEvent[] {
        if (!this.activeRooms.has(roomId)) {
            return [];
        }
        return this.eventStore.getEvents(roomId);
    }

    /**
     * Get events after a specific sequence number
     *
     * Useful when a client reconnects and only needs new events
     * 
     * @param roomId - The room identifier
     * @param afterSequence - The sequence number to start after
     * @returns The events after the sequence number
     */
    getEventsAfter(roomId: string, afterSequence: number): WhiteboardEvent[] {
        return this.eventStore.getEventsAfter(roomId, afterSequence);
    }

    /**
     * Clear all events for a room
     * @param roomId - The room identifier
     */
    clearRoom(roomId: string): void {
        this.eventStore.clearRoomEvents(roomId);
        this.activeRooms.delete(roomId);
    }

    /**
     * Get all active rooms
     * 
     * @returns The active rooms
     */
    getActiveRooms(): string[] {
        return Array.from(this.activeRooms);
    }

    /**
     * Check if a room exists
     * @param roomId - The room identifier
     * @returns True if the room exists, false otherwise
     */
    roomExists(roomId: string): boolean {
        return this.activeRooms.has(roomId);
    }
}