import { Injectable, signal, computed } from '@angular/core';
import type { WhiteboardEvent } from '../models/events.model';
/**
 * WhiteboardStore
 * 
 * PURPOSE: Manages whiteboard state (events, room, user count) using signals
 * 
 * WHY IT MATTERS:
 * This is the single source of truth for all whiteboard events.
 * Components can reactively read events and the canvas can render from them.
 * Events are stored in order and deduplicated automatically.
 * 
 * HOW IT WORKS:
 * 1. EventService adds events → addEvent() called
 * 2. Events stored in signals array
 * 3. Computed signals provide sorted events and last sequence
 * 4. Components read events signal → Canvas renders reactively
 * 
 * EXAMPLE:
 * User draws line → EventService creates event → addEvent() called
 *   ↓
 * Event added to events signal
 *   ↓
 * sortedEvents() computed signal updates
 *   ↓
 * Component effect() triggers → Canvas renders new event
 */
@Injectable({
  providedIn: 'root',
})
export class WhiteboardStore {
  private _events = signal<WhiteboardEvent[]>([]);
  private _currentRoom = signal<string | null>(null);
  private _userCount = signal<number>(0);

  readonly events = this._events.asReadonly();
  readonly currentRoom = this._currentRoom.asReadonly();
  readonly userCount = this._userCount.asReadonly();

  /**
   * Computed signal: Get the last sequence number
   * 
   * Returns the highest sequence number from all events.
   * Used to determine what events a client needs when reconnecting.
   * 
   * @returns The last sequence number, or 0 if no events
   * 
   * Example:
   * Events: [{ sequence: 1 }, { sequence: 5 }, { sequence: 3 }]
   * lastSequence() → Returns 5
   */
  readonly lastSequence = computed(() => {
    const evts = this._events();
    if (evts.length === 0) return 0;
    return Math.max(...evts.map(e => e.sequence || 0));
  });

  /**
   * Computed signal: Get events sorted by sequence
   * 
   * Returns all events sorted by sequence number.
   * Used by canvas to render events in correct order.
   * 
   * @returns Events sorted by sequence number
   * 
   * Example:
   * Events: [{ sequence: 3 }, { sequence: 1 }, { sequence: 2 }]
   * sortedEvents() → Returns [{ sequence: 1 }, { sequence: 2 }, { sequence: 3 }]
   */
  readonly sortedEvents = computed(() => {
    return [...this._events()].sort((a, b) => 
      (a.sequence || 0) - (b.sequence || 0)
    );
  });

  /**
   * Computed signal: Get total event count
   * 
   * @returns The number of events in the store
   */
  readonly eventCount = computed(() => this._events().length);

  /**
   * Add a single event to the store
   * 
   * Adds an event if it doesn't already exist (deduplication).
   * Checks by sequence number or timestamp+userId combination.
   * 
   * @param event - The event to add
   * 
   * Example:
   * addEvent({ type: 'DRAW_LINE', sequence: 5, ... })
   * → Checks if event with sequence 5 exists
   * → If not, adds event to events array
   * → sortedEvents() computed signal updates automatically
   */
  addEvent(event: WhiteboardEvent): void {
    const existing = this._events().find(
      e => e.sequence === event.sequence || 
           (e.timestamp === event.timestamp && e.userId === event.userId)
    );

    if (!existing) {
      this._events.update(events => [...events, event]);
    }
  }

  /**
   * Add multiple events to the store
   * 
   * Used when receiving state snapshot from server (e.g., on room join).
   * Deduplicates events before adding.
   * 
   * @param events - Array of events to add
   * 
   * Example:
   * addEvents([{ sequence: 1 }, { sequence: 2 }, { sequence: 3 }])
   * → Checks each event for duplicates
   * → Adds all new events to store
   * → sortedEvents() computed signal updates automatically
   */
  addEvents(events: WhiteboardEvent[]): void {
    this._events.update(current => {
      const existing = new Set(
        current.map(e => `${e.sequence}-${e.timestamp}-${e.userId}`)
      );
      const newEvents = events.filter(
        e => !existing.has(`${e.sequence}-${e.timestamp}-${e.userId}`)
      );
  
      return [...current, ...newEvents];
    })
  }

  /**
   * Set the current room ID
   * 
   * Called when user joins a room.
   * 
   * @param roomId - The room identifier
   * 
   * Example:
   * setRoom('room-123')
   * → Sets currentRoom to 'room-123'
   */
  setRoom(roomId: string): void {
    this._currentRoom.set(roomId);
  }

  /**
   * Set the user count for the current room
   * 
   * Called when receiving room state or user count updates.
   * 
   * @param count - The number of users in the room
   * 
   * Example:
   * setUserCount(3)
   * → Sets userCount to 3
   */
  setUserCount(count: number): void {
    this._userCount.set(count);
  }

  /**
   * Clear all events from the store
   * 
   * Removes all events but keeps room and user count.
   * 
   * Example:
   * clearEvents()
   * → Sets events to empty array
   */
  clearEvents(): void {
    this._events.set([]);
  }

  /**
   * Clear room information
   * 
   * Removes room ID and resets user count.
   * 
   * Example:
   * clearRoom()
   * → Sets currentRoom to null
   * → Sets userCount to 0
   */
  clearRoom(): void {
    this._currentRoom.set(null);
    this._userCount.set(0);
  }

  /**
   * Reset everything (events, room, user count)
   * 
   * Clears all state. Used when leaving a room or resetting.
   * 
   * Example:
   * reset()
   * → Clears all events
   * → Clears room
   * → Resets user count
   */
  reset(): void {
    this.clearEvents();
    this.clearRoom();
  }
}
