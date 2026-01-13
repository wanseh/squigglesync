import { Injectable, signal } from '@angular/core';
/**
 * UserStore
 * 
 * PURPOSE: Manages user identity and session information
 * 
 * WHY IT MATTERS:
 * We need to track which user is currently using the app.
 * This user ID is included in all events sent to the server.
 * 
 * HOW IT WORKS:
 * 1. User enters name → setUser(userId, userName) called
 * 2. User ID and name stored in signals
 * 3. Components read signals to display user info
 * 4. EventService uses userId when creating events
 * 
 * EXAMPLE:
 * User enters name "Alice" → setUser() called
 *   ↓
 * userId and userName signals updated
 *   ↓
 * EventService creates event with userId from store
 */
@Injectable({
  providedIn: 'root',
})
export class UserStore {
  private _userId = signal<string>('');
  private _userName = signal<string>('');

  readonly userId = this._userId.asReadonly();
  readonly userName = this._userName.asReadonly();

  /**
   * Set the current user
   * 
   * Stores user ID and name for the current session.
   * 
   * @param userId - The unique user identifier
   * @param userName - The display name for the user
   * 
   * Example:
   * setUser('user-123', 'Alice')
   * → Sets userId to 'user-123'
   * → Sets userName to 'Alice'
   */
  setUser(userId: string, userName: string): void {
    this._userId.set(userId);
    this._userName.set(userName);
  }

  /**
   * Clear the current user
   * 
   * Removes user ID and name from store.
   * 
   * Example:
   * clearUser()
   * → Sets userId to ''
   * → Sets userName to ''
   */
  clearUser(): void {
    this._userId.set('');
    this._userName.set('');
  }

  /**
   * Generate a simple user ID
   * 
   * Creates a unique user ID if one doesn't exist.
   * 
   * @returns A generated user ID string
   */
  generateUserId(): string {
    return `user-${Math.random().toString(36).substring(2, 11)}`;
  }
}
