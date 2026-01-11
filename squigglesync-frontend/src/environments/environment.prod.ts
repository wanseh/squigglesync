/**
 * Production environment configuration (explicit)
 * Alternative production config if needed
 */
import type { Environment } from './environment.interface';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.squigglesync.com',
  wsUrl: 'wss://api.squigglesync.com',
};

