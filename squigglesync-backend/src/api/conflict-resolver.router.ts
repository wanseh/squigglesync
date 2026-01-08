import { createRouter } from '../utils/router.util';
import { WhiteboardEvent } from '../types/events';
import { ConflictResolverService } from '../services/conflict-resolver.service';

const router = createRouter();

const conflictResolverService = new ConflictResolverService();

/**
 * POST /api/conflict-resolver/test
 * Test the conflict resolver
 * @param req.body.roomId - The room ID
 * @param req.body.event - The event to resolve
 * @returns A message indicating that the event has been resolved
 * Test conflict resolution logic
 * 
 * This lets us see:
 * 1. Which events conflict with each other
 * 2. How conflicts are resolved
 * 3. What happens when events don't conflict
 * 
 * Request body:
 * {
 *   "existingEvents": [...],  // Events already in the system
 *   "newEvent": {...}          // New event to check for conflicts
 * }
 */
router.post('/', (req, res) => {
    const { existingEvents, newEvent } = req.body;

    if (!newEvent) {
        return res.status(400).json({ error: 'New event is required' });
    }

    try {
        const result = conflictResolverService.resolveConflict(
            existingEvents || [], newEvent as WhiteboardEvent);

        const hasConflict = result === null;


        res.json({
            success: true,
            hasConflict,
            result: result || null,
            explanation: hasConflict 
                ? 'Event was rejected due to conflict resolution rules'
                : 'Event was accepted - no conflicts detected',
            newEventType: newEvent.type,
            existingEventTypes: (existingEvents || []).map((event: WhiteboardEvent) => event.type),
        })
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

router.get('/scenarios', (req, res) => {
    res.json({
        scenarios: [
            {
                name: 'Drawing events - No conflict',
                description: 'Two users drawing at the same time - both should be accepted',
                existingEvents: [
                    {
                        type: 'DRAW_LINE',
                        userId: 'user-1',
                        roomId: 'room-123',
                        points: [[10, 10], [20, 20]],
                        color: '#FF0000',
                        strokeWidth: 2,
                        timestamp: Date.now() - 1000
                    }
                ],
                newEvent: {
                    type: 'DRAW_LINE',
                    userId: 'user-2',
                    roomId: 'room-123',
                    points: [[30, 30], [40, 40]],
                    color: '#0000FF',
                    strokeWidth: 2,
                    timestamp: Date.now()
                },
                expectedResult: 'Accepted (no conflict)'
            },
            {
                name: 'Clear canvas conflict',
                description: 'Two CLEAR_CANVAS events happening at the same time - second one should be rejected',
                existingEvents: [
                    {
                        type: 'CLEAR_CANVAS',
                        userId: 'user-1',
                        roomId: 'room-123',
                        timestamp: Date.now() - 500 // 500ms ago
                    }
                ],
                newEvent: {
                    type: 'CLEAR_CANVAS',
                    userId: 'user-2',
                    roomId: 'room-123',
                    timestamp: Date.now()
                },
                expectedResult: 'Rejected (conflict - recent clear exists)'
            },
            {
                name: 'Clear after drawing - No conflict',
                description: 'CLEAR_CANVAS after drawing events - should be accepted',
                existingEvents: [
                    {
                        type: 'DRAW_LINE',
                        userId: 'user-1',
                        roomId: 'room-123',
                        points: [[10, 10], [20, 20]],
                        color: '#FF0000',
                        strokeWidth: 2,
                        timestamp: Date.now() - 2000 // 2 seconds ago
                    }
                ],
                newEvent: {
                    type: 'CLEAR_CANVAS',
                    userId: 'user-2',
                    roomId: 'room-123',
                    timestamp: Date.now()
                },
                expectedResult: 'Accepted (no recent clear)'
            }
        ]
    });
});


export { router as conflictResolverRouter };