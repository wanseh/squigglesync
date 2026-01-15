/**
 * Application Constants
 * Centralized configuration values
 */

export const CONFLICT_RESOLVER = {
  CLEAR_COOLDOWN_MS: 1000, // 1 second cooldown between clear canvas events
} as const;

export const VALIDATION = {
  MAX_EVENT_SIZE: 1024 * 100, // 100KB max event size
  MAX_POINTS_PER_EVENT: 1000, // Maximum points in a single draw event
} as const;

export const WEBSOCKET = {
  MAX_MESSAGE_SIZE: 1024 * 100, // 100KB max WebSocket message
  PING_INTERVAL: 30000, // 30 seconds
  PONG_TIMEOUT: 10000, // 10 seconds
} as const;

export const MEMORY = {
  MAX_EVENTS_PER_ROOM: 10000, // Maximum events stored per room
  CLEANUP_INTERVAL_MS: 60000, // Cleanup every minute
  EVENT_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

