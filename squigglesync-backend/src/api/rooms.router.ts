import { Router } from 'express';
import { RoomsHandler } from '../handlers/rooms.handler';
import { RoomStateService } from '../services/room-state.service';
import { createRouter } from '../utils/router.util';

const router = createRouter();

const roomStateService = new RoomStateService();
const roomsHandler = new RoomsHandler(roomStateService);

/**
 * GET /api/rooms
 * 
 * Get all active rooms
 * @returns The active rooms
 * 
 * Example:
 * GET /api/rooms
 * Response:
 * {
 *     "rooms": ["room-123", "room-456"],
 *     "count": 2
 * }
 * 
 * Error:
 * 404 - Room not found
 * 500 - Internal Server Error
 */
router.get('/', (req, res) => {
    const rooms = roomsHandler.handleGetRooms();
    res.json({
        rooms,
        count: rooms.length
    });
});


/**
 * GET /api/rooms/:roomId/state
 * 
 * Get the state of a room
 * @param req.params.roomId - The room ID
 * @returns The state of the room
 * 
 * Example:
 * GET /api/rooms/room-123/state
 * Response:
 * {
 *     "roomId": "room-123",
 *     "events": [event1, event2, event3],
 *     "eventCount": 3,
 *     "exists": true
 * }
 * 
 * Error:
 * 404 - Room not found
 * 500 - Internal Server Error
 */ 
router.get('/:roomId/state', (req, res) => {
    const { roomId } = req.params;
    const state = roomsHandler.handleGetRoomState(roomId);
    
    if (!state.exists) {
        return res.status(404).json({ error: 'Room not found' });
    }

    res.json(state);
});

/**
 * DELETE /api/rooms/:roomId
 * 
 * Clear a room
 * @param req.params.roomId - The room ID
 * @returns The result of the room clearing
 * 
 * Example:
 * DELETE /api/rooms/room-123
 * Response:
 * {
 *     "success": true
 * }
 * 
 * Error:
 * 404 - Room not found
 * 500 - Internal Server Error
 */
router.delete('/:roomId', (req, res) => {
    const { roomId } = req.params;
    roomsHandler.handleClearRoom(roomId);
    res.json({ success: true, message: `Room ${roomId} cleared` });
});

export { router as roomsRouter };