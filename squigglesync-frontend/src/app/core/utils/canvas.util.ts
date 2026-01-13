/**
 * Canvas Utility Functions
 * 
 * PURPOSE: Provides helper functions for canvas coordinate transformations
 * 
 * WHY IT MATTERS:
 * Mouse/touch events provide screen coordinates, but we need canvas coordinates.
 * These utilities handle coordinate transformations, normalization, and calculations.
 * 
 * HOW IT WORKS:
 * 1. getCanvasCoordinates() - Converts mouse/touch event to canvas coordinates
 * 2. normalizeCoordinates() - Normalizes coordinates to canvas bounds
 * 3. getBoundingRect() - Calculates bounding rectangle for erase operations
 * 
 * EXAMPLE:
 * Mouse click at screen (100, 200)
 *   ↓
 * getCanvasCoordinates(event, canvas)
 *   ↓
 * Returns canvas coordinates [50, 100] (accounting for canvas position/scale)
 */

/**
 * Get canvas coordinates from a mouse or touch event
 * 
 * Converts screen coordinates to canvas-relative coordinates.
 * Accounts for canvas position, scaling, and device pixel ratio.
 * 
 * @param event - MouseEvent or TouchEvent
 * @param canvas - The HTMLCanvasElement
 * @returns Canvas coordinates as [x, y] tuple
 * 
 * Example:
 * getCanvasCoordinates(mouseEvent, canvasElement)
 * → Mouse at screen (150, 200)
 * → Canvas at position (50, 50) with scale 1.0
 * → Returns [100, 150]
 */
export function getCanvasCoordinates(
    event: MouseEvent | TouchEvent,
    canvas: HTMLCanvasElement
): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;

    if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        // TouchEvent
        const touch = event.touches[0] || event.changedTouches[0];
        if (!touch) {
            return [0, 0];
        }
        clientX = touch.clientX;
        clientY = touch.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return [x, y];
}


/**
 * Get bounding rectangle from an array of points
 * 
 * Calculates the smallest rectangle that contains all points.
 * Used for erase operations to determine the region to clear.
 * 
 * @param points - Array of [x, y] coordinate pairs
 * @returns Bounding rectangle { x, y, width, height }
 * 
 * Example:
 * getBoundingRect([[10, 20], [50, 30], [30, 60]])
 * → Returns { x: 10, y: 20, width: 40, height: 40 }
 */
export function getBoundingRect(
    points: [number, number][]
): { x: number; y: number; width: number; height: number } {
    if (points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = points[0][0];
    let minY = points[0][1];
    let maxX = points[0][0];
    let maxY = points[0][1];

    for (const [x, y] of points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Check if a point is within a rectangle
 * 
 * Used to determine if coordinates are within an erase region.
 * 
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param rect - Rectangle { x, y, width, height }
 * @returns True if point is within rectangle
 * 
 * Example:
 * isPointInRect(25, 30, { x: 10, y: 20, width: 40, height: 40 })
 * → Returns true (point is inside rectangle)
 */
export function isPointInRect(
    x: number,
    y: number,
    rect: { x: number; y: number; width: number; height: number }
): boolean {
    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    )
}
