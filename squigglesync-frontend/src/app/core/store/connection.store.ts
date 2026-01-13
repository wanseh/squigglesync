import { Injectable, signal, computed } from '@angular/core';
/**
 * ConnectionStore
 * 
 * PURPOSE: Manages WebSocket connection state using signals
 * 
 * WHY IT MATTERS:
 * This store provides reactive connection status that components can read.
 * It tracks connection lifecycle (connecting, connected, disconnected) and
 * errors, allowing UI to reactively update based on connection state.
 * 
 * HOW IT WORKS:
 * 1. WebSocketService calls setConnecting() when connecting
 * 2. WebSocketService calls setConnected(sessionId) when connected
 * 3. WebSocketService calls setDisconnected() when disconnected
 * 4. Components read signals reactively (isConnected, connectionStatus, etc.)
 * 
 * EXAMPLE:
 * Component reads isConnected() signal
 *   ↓
 * WebSocket connects → setConnected() called
 *   ↓
 * isConnected() signal updates → Component UI updates automatically
 */

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

@Injectable({
  providedIn: 'root',
})
export class ConnectionStore {

  private _isConnected = signal<boolean>(false);
  private _connectionStatus = signal<ConnectionStatus>('disconnected');
  private _sessionId = signal<string | null>(null);
  private _error = signal<string | null>(null);

  readonly isConnected = this._isConnected.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly sessionId = this._sessionId.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly isConnecting = computed(() => 
    this._connectionStatus() === 'connecting'
  );

  readonly hasError = computed(() => 
    this._error() !== null
  );
  
  /**
   * Set connection status to connecting
   * 
   * Called when WebSocket is attempting to connect.
   * Clears any previous errors and sets status to 'connecting'.
   * 
   * Example:
   * setConnecting()
   * → Sets connectionStatus to 'connecting'
   * → Sets isConnected to false
   * → Clears any error
   */
  setConnecting(): void {
    this._connectionStatus.set('connecting');
    this._isConnected.set(false);
    this._error.set(null);
  }

  /**
   * Set connection status to connected
   * 
   * Called when WebSocket successfully connects.
   * Stores the session ID from the server.
   * 
   * @param sessionId - The session ID received from server
   * 
   * Example:
   * setConnected('session-123')
   * → Sets connectionStatus to 'connected'
   * → Sets isConnected to true
   * → Stores sessionId 'session-123'
   * → Clears any error
   */
  setConnected(sessionId: string): void {
    this._connectionStatus.set('connected');
    this._isConnected.set(true);
    this._sessionId.set(sessionId);
    this._error.set(null);
  }

  /**
   * Set connection status to disconnected
   * 
   * Called when WebSocket disconnects.
   * Clears session ID and sets status to 'disconnected'.
   * 
   * Example:
   * setDisconnected()
   * → Sets connectionStatus to 'disconnected'
   * → Sets isConnected to false
   * → Clears sessionId
   */
  setDisconnected(): void {
    this._connectionStatus.set('disconnected');
    this._isConnected.set(false);
    this._sessionId.set(null);
  }

  /**
   * Set an error message
   * 
   * Called when a connection error occurs.
   * Stores the error message and sets status to 'disconnected'.
   * 
   * @param error - The error message
   * 
   * Example:
   * setError('WebSocket connection failed')
   * → Stores error message
   * → Sets connectionStatus to 'disconnected'
   * → Sets isConnected to false
   */
  setError(error: string): void {
    this._error.set(error);
    this._connectionStatus.set('disconnected');
    this._isConnected.set(false);
  }
}
