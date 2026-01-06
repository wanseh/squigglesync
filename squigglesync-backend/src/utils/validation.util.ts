import { WhiteboardEvent, DrawLineEvent, DrawPathEvent, EraseEvent } from '../types/events';

/**
 * Validation Utilities
 * 
 * PURPOSE: Validate events before processing
 * 
 * WHY IT MATTERS:
 * - Prevents invalid data from entering the system
 * - Ensures type safety
 * - Prevents security issues (XSS, injection)
 * - Validates coordinates are within bounds
 * 
 * WHAT WE VALIDATE:
 * 1. Required fields exist
 * 2. Field types are correct
 * 3. Coordinates are valid numbers
 * 4. Colors are valid hex codes
 * 5. No malicious data
 */

/**
 * Validate the base event fields
 * 
 * @param event - The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function validateBaseEvent(event: any): boolean {
    if (!event) return false;
    if (!event.type || typeof event.type !== 'string') return false;
    if (!event.userId || typeof event.userId !== 'string') return false;
    if (!event.roomId || typeof event.roomId !== 'string') return false;
    if (!event.timestamp || typeof event.timestamp !== 'number') return false;

    return true;
}

/**
 * Validate a DRAW_LINE event
 * @param event - The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function validateDrawLineEvent(event: any): boolean {
    if (!validateBaseEvent(event)) return false;
    if (event.type !== 'DRAW_LINE') return false;
    
    // Validate points array
    if (!Array.isArray(event.points)) return false;
    if (event.points.length < 2) return false; // Need at least 2 points for a line
    
    // Validate each point is [number, number]
    for (const point of event.points) {
        if (!Array.isArray(point) || point.length !== 2) return false;
        if (typeof point[0] !== 'number' || typeof point[1] !== 'number') return false;
        if (!isFinite(point[0]) || !isFinite(point[1])) return false; // No NaN or Infinity
    }
    
    // Validate color (hex code)
    if (!event.color || typeof event.color !== 'string') return false;
    if (!/^#[0-9A-Fa-f]{6}$/.test(event.color)) return false;
    
    // Validate strokeWidth
    if (typeof event.strokeWidth !== 'number') return false;
    if (event.strokeWidth <= 0 || event.strokeWidth > 100) return false; // Reasonable bounds
    
    return true;
}

/**
 * Validate a DRAW_PATH event
 * @param event - The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function validateDrawPathEvent(event: any): boolean {
    if (!validateBaseEvent(event)) return false;
    if (event.type !== 'DRAW_PATH') return false;

    if (!Array.isArray(event.path)) return false;
    if (event.path.length < 2) return false;

    for (const point of event.path) {
        if (!Array.isArray(point) || point.length !== 2) return false;
        if (typeof point[0] !== 'number' || typeof point[1] !== 'number') return false;
        if (!isFinite(point[0]) || !isFinite(point[1])) return false;
    }

    if (!event.color || typeof event.color !== 'string') return false;
    if (!/^#([0-9a-fA-F]{6})$/.test(event.color)) return false;

    if (typeof event.strokeWidth !== 'number') return false;
    if (event.strokeWidth <= 0 || event.strokeWidth > 100) return false;

    return true;
}

/**
 * Validate an ERASE event
 * 
 * @param event - The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function validateEraseEvent(event: any): boolean {
    if (!validateBaseEvent(event)) return false;
    if (event.type !== 'ERASE') return false;
    
    // Validate region object
    if (!event.region || typeof event.region !== 'object') return false;
    
    const { x, y, width, height } = event.region;
    if (typeof x !== 'number' || typeof y !== 'number') return false;
    if (typeof width !== 'number' || typeof height !== 'number') return false;
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) return false;
    if (width <= 0 || height <= 0) return false; // Must have positive dimensions
    
    return true;
}

/**
 * Validate a CLEAR_CANVAS event
 * @param event - The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function validateClearCanvasEvent(event: any): boolean {
    if (!validateBaseEvent(event)) return false;
    if (event.type !== 'CLEAR_CANVAS') return false;

    return true;
}

/**
 * Validate any WHITEBOARD_EVENT
 * @param event - The event to validate
 * @returns True if the event is valid, false otherwise
 */
export function validateEvent(event: WhiteboardEvent): boolean {
    if (!event || !event.type) return false;
    
    switch (event.type) {
        case 'DRAW_LINE':
            return validateDrawLineEvent(event);
        case 'DRAW_PATH':
            return validateDrawPathEvent(event);
        case 'ERASE':
            return validateEraseEvent(event);
        case 'CLEAR_CANVAS':
            return validateClearCanvasEvent(event);
        case 'JOIN_ROOM':
        case 'LEAVE_ROOM':
            return validateBaseEvent(event);
        default:
            return false; // invalid event type
    }
}

/**
 * Sanitize an event (remove any potential malicious data
 * 
 * @param event - The event to sanitize
 * @returns The sanitized event
 */
export function sanitizeEvent(event: WhiteboardEvent): WhiteboardEvent {
    // stub this for now
    return { ...event   };
}

