/**
 * Environment configuration interface
 * Ensures type safety when accessing environment variables
 */
export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

