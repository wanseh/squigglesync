
import { RoomStateService } from '../services/room-state.service';
import { WhiteboardEvent } from '../types/events';
import { validateEvent } from '../utils/validation.util';
import { createRouter } from '../utils/router.util';

const router = createRouter();

const roomStateService = new RoomStateService();

/**
 * POST /api/room-state/test/process
 * Test the room state service
 * 
 * @param req.body.roomId - The room ID
 * @param req.body.event - The event to process
 * @returns The processed event
 * 
 * This shows the complete flow:
 * 1. Validation
 * 2. Conflict resolution
 * 3. Event storage
 * 4. Sequence assignment
 * 
 * Example:
 * POST /api/room-state/test/process
 * Body: { roomId: 'room-123', event: { type: 'DRAW_LINE', userId: 'user-123', points: [[0,0], [100,100]] } }
 */
router.post('/test/process', (req, res) => {
    const { roomId, event } = req.body;

    try {
        const processedEvent = roomStateService.processEvent(roomId, event as WhiteboardEvent);
        if (!processedEvent) {
            return res.json({
                success: false,
                message: 'Event rejected due to conflict resolution',
                roomId,
                eventType: event.type
            });
        }

        const currentState = roomStateService.getState(roomId);
        res.json({
            success: true,
            processedEvent,
            currentState,
            totalEvents: currentState.length,
            message: 'Event processed successfully! Check sequence number and state ordering.'
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
  * GET /api/room-state/test/:roomId
  * 
  * Get the current state of a room
  * @param req.params.roomId - The room ID
  * @returns The current state of the room
  * 
  * Example:
  * GET /api/room-state/test/room-123
  * Response:
  * {
  *     "roomId": "room-123",
  *     "currentState": [...],
  *     "totalEvents": 10
  * }
  * 
  * Error:
  * 400 - Bad Request
  * 500 - Internal Server Error
  */
router.get('/test/state/:roomId', (req, res) => {
    const { roomId } = req.params;
    const state = roomStateService.getState(roomId);

    res.json({
        roomId,
        events: state,
        count: state.length,
        sequences: state.map(e => e.sequence),
        exists: roomStateService.roomExists(roomId)
    });
});

/**
 * GET /api/room-state/test/rooms
 * 
 * Get all active rooms
 * @returns The active rooms
 * 
 * Example:
 * Response:
 * {
 *     "rooms": ["room-123", "room-456"],
 *     "count": 2
 * }
 */
router.get('/test/rooms', (req, res) => {
    const rooms = roomStateService.getActiveRooms();
    console.log(`Active rooms: ${rooms}`);
    res.json({ rooms, count: rooms.length });
});


export { router as roomStateRouter };