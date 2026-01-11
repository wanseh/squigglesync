/**
 * Development environment configuration
 * This file replaces environment.ts during development builds
 */
import type { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3000',
};
