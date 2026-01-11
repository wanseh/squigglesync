/**
 * Production environment configuration
 * This file is used when building for production
 */
import type { Environment } from './environment.interface';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.squigglesync.com',
  wsUrl: 'wss://api.squigglesync.com',
};
