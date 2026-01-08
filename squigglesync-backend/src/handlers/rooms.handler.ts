import { RoomStateService } from '../services/room-state.service';
/**
 * RoomsHandler
 * 
 * PURPOSE: Business logic for room management
 * 
 * This sits between the API layer and the service layer.
 */
export class RoomsHandler {
    private roomStateService: RoomStateService;

    constructor(roomStateService: RoomStateService) {
        this.roomStateService = roomStateService;
    }

    /**
     * Handle room retrieval
     * @returns The active rooms
     * 
     * Example:
     * handleGetRooms()
     * → Returns ["room-123", "room-456"]
     * 
     */
    handleGetRooms(): string[] {
        return this.roomStateService.getActiveRooms();
    }
    
    /**
     * Handle room state retrieval
     * @param roomId - The room ID
     * @returns The state of the room
     * 
     * Example:
     * handleGetRoomState('room-123')
     * → Returns { roomId: 'room-123', events: [event1, event2, event3], eventCount: 3, exists: true }
     */
    handleGetRoomState(roomId: string): {
        roomId: string;
        events: any[];
        error?: string;
        eventCount: number;
        exists: boolean;
    } {
        const events = this.roomStateService.getState(roomId);

        return {
            roomId,
            events,
            eventCount: events.length,
            exists: this.roomStateService.roomExists(roomId)
        }
    }

    /**
     * Handle room clearing
     * @param roomId - The room ID
     */
    handleClearRoom(roomId: string): void {
        this.roomStateService.clearRoom(roomId);
    }
    
}
