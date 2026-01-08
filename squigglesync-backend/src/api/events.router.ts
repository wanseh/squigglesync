import { Router } from 'express';
import { EventsHandler } from '../handlers/events.handler';
import { RoomStateService } from '../services/room-state.service';
import { createRouter } from '../utils/router.util';

const router = createRouter();

const roomStateService = new RoomStateService();
const eventsHandler = new EventsHandler(roomStateService);



/**
 * POST /api/events
 * 
 * Submit a new drawing event
 * 
 * This is the production endpoint for submitting events.
 * It uses the EventsHandler which coordinates validation,
 * conflict resolution, and storage.
 */
router.post('/', (req, res) => {
    const { roomId, event } = req.body;

    const result = eventsHandler.handleEventSubmission(roomId, event);

    if (!result.success) {
        return res.status(400).json({ 
            error: result.error || 'Failed to process event' 
        });
    }

    res.json({
        success: true,
        event: result.event
    });
});

/**
 * GET /api/events/:roomId
 * 
 * Get all events for a room
 * 
 * Optional query param: ?after=5 (get events after sequence 5)
 */
router.get('/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { after } = req.query;

    try {
        const afterSequence = after ? parseInt(after as string) : undefined;
        const events = eventsHandler.handleGetEvents(roomId, afterSequence);

        res.json({
            roomId,
            events,
            count: events.length,
            lastSequence: events[events.length - 1]?.sequence || 0,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export { router as eventsRouter };