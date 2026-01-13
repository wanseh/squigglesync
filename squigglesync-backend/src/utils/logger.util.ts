/**
 * Logger utility - automatically adds timestamps to all console methods
 * 
 * This patches console.log, console.warn, console.error, and console.debug
 * to automatically prepend ISO timestamps to all log messages.
 * 
 * Call setupLogger() at application startup to enable automatic timestamps.
 */

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalDebug = console.debug;

function formatWithTimestamp(...args: any[]): any[] {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}]`, ...args];
}

/**
 * Setup automatic timestamp logging
 * 
 * Patches console methods to automatically add timestamps.
 * Call this once at application startup.
 */
export function setupLogger(): void {
  console.log = (...args: any[]) => {
    originalLog(...formatWithTimestamp(...args));
  };

  console.warn = (...args: any[]) => {
    originalWarn(...formatWithTimestamp(...args));
  };

  console.error = (...args: any[]) => {
    originalError(...formatWithTimestamp(...args));
  };

  console.debug = (...args: any[]) => {
    originalDebug(...formatWithTimestamp(...args));
  };
}

