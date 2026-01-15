import { WhiteboardEvent } from '../types/events';
import { CONFLICT_RESOLVER } from '../config/constants';

/**
 * ConflictResolverService
 * 
 * PURPOSE: Resolves conflicts when concurrent events occur
 * 
 * WHY IT MATTERS FOR CONCURRENCY:
 * When multiple users perform actions at the same time, some actions might conflict:
 * - Two CLEAR_CANVAS events happening simultaneously
 * - A CLEAR_CANVAS right after someone just cleared
 * - Other edge cases where events can't coexist
 * 
 * HOW IT WORKS:
 * - Checks if new event conflicts with existing events
 * - Applies conflict resolution rules
 * - Returns the event if accepted, null if rejected
 * 
 * CONFLICT RESOLUTION STRATEGIES:
 * 1. Drawing events (DRAW_LINE, DRAW_PATH, ERASE):
 *    - NO CONFLICTS - All drawing events can coexist
 *    - Multiple users can draw simultaneously
 * 
 * 2. CLEAR_CANVAS:
 *    - CONFLICTS with recent CLEAR_CANVAS events
 *    - If a clear happened in the last 1 second, reject new clear
 *    - Prevents accidental double-clears
 * 
 * 3. Control events (JOIN_ROOM, LEAVE_ROOM):
 *    - NO CONFLICTS - These are informational
 * 
 * EXAMPLE SCENARIOS:
 * 
 * Scenario 1: Two users drawing
 * - User A draws line → Accepted (no conflicts)
 * - User B draws line (at same time) → Accepted (no conflicts)
 * Result: Both lines appear on canvas
 * 
 * Scenario 2: Double clear
 * - User A clears canvas → Accepted
 * - User B clears canvas (500ms later) → Rejected (conflict!)
 * Result: Canvas cleared once, second clear ignored
 * 
 * Scenario 3: Clear after drawing
 * - User A draws line → Accepted
 * - User B clears canvas (2 seconds later) → Accepted (no recent clear)
 * Result: Canvas cleared (normal operation)
 */
export class ConflictResolverService {
    private readonly CLEAR_COOLDOWN_MS = CONFLICT_RESOLVER.CLEAR_COOLDOWN_MS;

    /**
     * Resolve conflicts between existing events and a new event
     * 
     * This is the main conflict resolution function.
     * It checks if the new event conflicts with existing events
     * and applies resolution rules.
     * 
     * @param existingEvents - Events already in the system (for context)
     * @param newEvent - The new event to check for conflicts
     * @returns The event if accepted, null if rejected due to conflict
     * 
     * EXAMPLE:
     * existingEvents = [DRAW_LINE event]
     * newEvent = CLEAR_CANVAS
     * → Returns CLEAR_CANVAS (no conflict, clear is allowed)
     * 
     * existingEvents = [CLEAR_CANVAS event from 500ms ago]
     * newEvent = CLEAR_CANVAS
     * → Returns null (conflict! recent clear exists)
     */
    resolveConflict(
        existingEvents: WhiteboardEvent[],
        newEvent: WhiteboardEvent
    ): WhiteboardEvent | null {

        if (this.isDrawingEvent(newEvent)) {
            return newEvent;
        }

        // CLEAR_CANVAS conflicts are handled separately
        if (newEvent.type === 'CLEAR_CANVAS') {
            return this.handleClearCanvasConflict(existingEvents, newEvent);
        }

        if (this.isControlEvent(newEvent)) {
            return newEvent;
        }

        // default case: accept the event
        return newEvent;
    }

    /**
     * Check if the event is a drawing event
     * 
     * Drawing events can coexist, so we don't need to check for conflicts
     * 
     * @param event - The event to check
     * @returns True if the event is a drawing event, false otherwise
     */
    private isDrawingEvent(event: WhiteboardEvent): boolean {
        return (
            event.type === 'DRAW_LINE' ||
            event.type === 'DRAW_PATH' ||
            event.type === 'ERASE'
        )
    }

    /**
     * Handle conflicts for CLEAR_CANVAS events
     * 
     * Rule: If a CLEAR_CANVAS happened recently (within cooldown period),
     * reject the new clear to prevent accidental double-clears.
     * 
     * @param existingEvents - The existing events in the room
     * @param newEvent - The new event to check for conflicts
     * @returns The event if accepted, null if rejected
     */
    private handleClearCanvasConflict(
        existingEvents: WhiteboardEvent[],
        newEvent: WhiteboardEvent
    ): WhiteboardEvent | null {
        const recentClears = existingEvents
            .filter(event => event.type === 'CLEAR_CANVAS')
            .sort((a, b) => b.timestamp - a.timestamp) // Most recent first

        // If no recent clears, accept the new clear
        if (recentClears.length === 0) {
            return newEvent;
        }

        const mostRecentClear = recentClears[0];
        const timeSinceLastClear = newEvent.timestamp - mostRecentClear.timestamp;

        // If the new clear is within the cooldown period, reject it
        if (timeSinceLastClear < this.CLEAR_COOLDOWN_MS) {
            return null;
        }

        return newEvent;
    }

    /**
     * Check if the event is a control event
     * 
     * Control events can coexist, so we don't need to check for conflicts
     * 
     * @param event - The event to check
     * @returns True if the event is a control event, false otherwise
     */
    private isControlEvent(event: WhiteboardEvent): boolean {
        return (
            event.type === 'JOIN_ROOM' || 
            event.type === 'LEAVE_ROOM'
        );
    }
}