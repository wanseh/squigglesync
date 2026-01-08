import { createRouter } from '../utils/router.util';
import { SequenceManagerService } from '../services/sequence-manager.service';

const router = createRouter();

const sequenceManagerService = new SequenceManagerService();

/**
 * GET /api/test-sequence/:roomId
 * Get the next sequence number for a room
 * @param req.params.roomId - The room ID
 * @returns The next sequence number for the room
 * 
 * Example:
 * GET /api/test-sequence/room-123
 * Response:
 * {
 *     "roomId": "room-123",
 *     "currentSequence": 0,
 *     "nextSequence": 1
 * }
 * 
 * Error:
 * 400 - Bad Request
 * 500 - Internal Server Error
 */
router.get('/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        const current = sequenceManagerService.getCurrentSequence(roomId);
        const next = sequenceManagerService.getNextSequence(roomId);
        const next2 = sequenceManagerService.getNextSequence(roomId);

        res.json({
            roomId,
            currentSequence: current,
            firstNextSequence: next,
            secondNextSequence: next2,
            message: 'Sequence manager is working! Notice how sequence increments.'
          });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /api/reset/:roomId
 * Reset the sequence counter for a room
 * @param req.params.roomId - The room ID
 * @returns A message indicating that the sequence manager has been reset for the room
 * 
 * Example:
 * GET /api/reset/room-123
 * Response:
 * { message: 'Sequence manager reset for room room-123' }
 * 
 * Error:
 * 400 - Bad Request
 * 500 - Internal Server Error
 */
router.get('/reset/:roomId', (req, res) => {
    const { roomId } = req.params;
    sequenceManagerService.resetSequence(roomId);

    res.json({ message: 'Sequence manager reset for room ' + roomId });
})

export { router as sequenceManagerRouter };