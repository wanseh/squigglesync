import { Injectable } from '@angular/core';
import type { WhiteboardEvent, DrawLineEvent, DrawPathEvent, EraseEvent, ClearCanvasEvent } from '../models/events.model';
import { isDrawLineEvent, isDrawPathEvent, isEraseEvent, isClearCanvasEvent } from '../models/events.model';
/**
 * CanvasService
 * 
 * PURPOSE: Manages canvas rendering operations
 * 
 * WHY IT MATTERS:
 * This service handles all drawing operations on the HTML5 Canvas.
 * It provides a clean API for rendering events to the canvas and
 * manages the canvas context state.
 * 
 * HOW IT WORKS:
 * 1. initialize() → Sets up canvas context and drawing settings
 * 2. renderEvent() → Renders a single event to canvas
 * 3. drawLine() / drawPath() → Draws lines/paths
 * 4. erase() → Clears a rectangular region
 * 5. clear() → Clears entire canvas
 * 
 * EXAMPLE FLOW:
 * 
 * Event received → renderEvent(event) called
 *   ↓
 * Check event type (DRAW_LINE, ERASE, etc.)
 *   ↓
 * Call appropriate drawing method
 *   ↓
 * Canvas updated visually
 */
@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isInitialized = false;

  /**
   * Initialize the canvas
   * 
   * Sets up the canvas element and gets the 2D rendering context.
   * Configures default drawing settings (line cap, join, etc.).
   * 
   * @param canvasElement - The HTMLCanvasElement to use
   * 
   * Example:
   * initialize(canvasElement)
   * → Stores canvas reference
   * → Gets 2D context
   * → Sets default drawing styles
   * → Sets isInitialized to true
   */
  initialize(canvasElement: HTMLCanvasElement): void {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', {
      willReadFrequently: false
    })

    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Set default drawing styles
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.isInitialized = true;
  }
  
  /**
   * Render a whiteboard event to the canvas
   * 
   * Main entry point for rendering events.
   * Routes to appropriate drawing method based on event type.
   * 
   * @param event - The event to render
   * 
   * Example:
   * renderEvent({ type: 'DRAW_LINE', points: [[0,0], [100,100]], color: '#FF0000', strokeWidth: 3 })
   * → Calls drawLine() with event data
   * → Line appears on canvas
   */
  renderEvent(event: WhiteboardEvent): void {
    if (!this.isInitialized || !this.ctx) {
      console.warn('Canvas not initialized or context not available');
      return;
    }

    if (isDrawLineEvent(event)) {
      this.drawLine(event.points, event.color, event.strokeWidth);
    } else if (isDrawPathEvent(event)) {
      this.drawPath(event.path, event.color, event.strokeWidth);
    } else if (isEraseEvent(event)) {
      this.erase(event.region);
    } else if (isClearCanvasEvent(event)) {
      this.clear();
    }
  }

  /**
   * Draw a line through multiple points
   * 
   * Draws a connected line through all points.
   * Uses the specified color and stroke width.
   * 
   * @param points - Array of [x, y] coordinate pairs
   * @param color - Stroke color (hex string)
   * @param strokeWidth - Stroke width in pixels
   * 
   * Example:
   * drawLine([[0, 0], [50, 50], [100, 0]], '#FF0000', 3)
   * → Sets stroke style to red, width 3
   * → Draws line through all three points
   * → Line appears on canvas
   */
  drawLine(
    points: [number, number][], 
    color: string, 
    strokeWidth: number
  ): void {
    if (!this.ctx || points.length === 0) {
      return;
    }

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draw a continuous path
   * 
   * Similar to drawLine but optimized for continuous drawing.
   * Used for smooth stroke rendering.
   * 
   * @param path - Array of [x, y] coordinate pairs
   * @param color - Stroke color (hex string)
   * @param strokeWidth - Stroke width in pixels
   * 
   * Example:
   * drawPath([[0, 0], [10, 5], [20, 10], ...], '#0000FF', 2)
   * → Draws smooth continuous path
   * → Path appears on canvas
   */
  private drawPath(
    path: [number, number][],
    color: string,
    strokeWidth: number
  ): void {
    if (!this.ctx || path.length === 0) {
      return;
    }

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(path[0][0], path[0][1]);

    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i][0], path[i][1]);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Erase a rectangular region
   * 
   * Clears a rectangular area on the canvas using composite operation.
   * Uses 'destination-out' blend mode to erase.
   * 
   * @param region - Rectangle { x, y, width, height }
   * 
   * Example:
   * erase({ x: 10, y: 10, width: 50, height: 50 })
   * → Sets composite operation to 'destination-out'
   * → Fills rectangle area
   * → Region is cleared on canvas
   */
  erase(region: { x: number; y: number; width: number; height: number }): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillRect(region.x, region.y, region.width, region.height);
    this.ctx.restore();
  }

  /**
   * Clear the entire canvas
   * 
   * Clears the canvas by filling it with the background color.
   * 
   * Example:
   * clear()
   * → Fills canvas with background color
   * → Canvas is cleared
  */
  clear(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Re-render all events to canvas
   * 
   * Clears canvas and re-renders all events in order.
   * Used when reconstructing canvas state from events.
   * 
   * @param events - Array of events to render
   * 
   * Example:
   * renderAllEvents([event1, event2, event3])
   * → Clears canvas
   * → Renders event1
   * → Renders event2
   * → Renders event3
   * → Canvas shows all drawings
   */
  renderAllEvents(events: WhiteboardEvent[]): void {
    this.clear();

    for (const event of events) {
      this.renderEvent(event);
    }
  }

  /**
   * Get the canvas element
   * 
   * Returns the canvas element used by this service.
   * 
   * @returns The HTMLCanvasElement
   * 
   * Example:
   * getCanvas()
   * → Returns the canvas element
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Get the canvas context
   * 
   * Returns the 2D rendering context used by this service.
   * 
   * @returns The CanvasRenderingContext2D
   * 
   * Example:
   * getContext()
   * → Returns the canvas context
  */
  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Check if the canvas is initialized
   * 
   * Returns true if the canvas is initialized and ready for use.
   * 
   * @returns True if initialized, false otherwise
   * 
   * Example:
   * isReady()
   * → Returns true if initialized, false otherwise
  */
  isReady(): boolean {
    return this.isInitialized && this.ctx !== null;
  }
}
