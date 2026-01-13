import { Request, Response, NextFunction } from 'express';

/**
 * Logging middleware - logs request info with timing
 * Logs the HTTP method, URL, and response time for each request
 * Timestamps are automatically added by the logger utility
 */
export function logMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  console.debug(`${req.method} ${req.originalUrl}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Log slow requests (>1000ms) as warnings
    if (duration > 1000) {
      console.warn(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) - SLOW`);
    } else {
      console.debug(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
}

