import { Request, Response, NextFunction } from 'express';
import { validateEvent } from '../utils/validation.util';

/**
 * Validation middleware for whiteboard events
 * Validates that the request body contains a valid roomId and event
 * 
 * Usage:
 * router.post('/', validateEventMiddleware, (req, res) => { ... });
 */
export function validateEventMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only validate for requests with a body (POST, PUT, PATCH)
  // GET requests without body will skip validation
  if (!req.body || Object.keys(req.body).length === 0) {
    return next();
  }

  const { roomId, event } = req.body;

  // If there's an event in the body, validate it
  if (event) {
    // Validate roomId if event is present
    if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
      res.status(400).json({ 
        error: 'Invalid roomId',
        message: 'roomId is required and must be a non-empty string'
      });
      return;
    }

    // Validate event structure
    if (!validateEvent(event)) {
      res.status(400).json({ 
        error: 'Invalid event data',
        message: 'Event failed validation checks. Ensure all required fields are present and valid.',
        eventType: event?.type || 'unknown'
      });
      return;
    }
  }

  // Validation passed (or no event to validate), continue to next middleware/handler
  next();
}

