import { Component, inject, effect, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { ConnectionStore, UserStore, WhiteboardStore } from './core/store';
import { WebSocketService } from './core/services/websocket.service';
import { EventService } from './core/services/event.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-test-stores',
  template: `
    <div class="p-4 space-y-6">
      <h1 class="text-2xl font-bold mb-4">Store Testing Component</h1>
      
      <section class="border p-4 rounded">
        <h2 class="text-xl font-semibold mb-2">Connection Store</h2>
        <p>Connected: {{ connectionStore.isConnected() }}</p>
        <p>Status: {{ connectionStore.connectionStatus() }}</p>
        <p>Session ID: {{ connectionStore.sessionId() || 'None' }}</p>
        @if (connectionStore.error()) {
          <p class="text-red-600">Error: {{ connectionStore.error() }}</p>
        }
        <div class="mt-2 space-x-2">
          <button
            type="button"
            (click)="connect()"
            [disabled]="connectionStore.isConnected()"
            class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            Connect
          </button>
          <button
            type="button"
            (click)="disconnect()"
            [disabled]="!connectionStore.isConnected()"
            class="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
          >
            Disconnect
          </button>
        </div>
      </section>
      
      <section class="border p-4 rounded">
        <h2 class="text-xl font-semibold mb-2">User Store</h2>
        <p>User ID: {{ userStore.userId() || '(empty)' }}</p>
        <p>User Name: {{ userStore.userName() || '(empty)' }}</p>
        <div class="mt-2 space-x-2">
          <button
            type="button"
            (click)="setTestUser()"
            class="px-4 py-2 bg-green-500 text-white rounded"
          >
            Set Test User
          </button>
          <button
            type="button"
            (click)="clearUser()"
            class="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Clear User
          </button>
        </div>
      </section>
      
      <section class="border p-4 rounded">
        <h2 class="text-xl font-semibold mb-2">Whiteboard Store</h2>
        <p>Room: {{ whiteboardStore.currentRoom() || '(none)' }}</p>
        <p>Event Count: {{ whiteboardStore.eventCount() }}</p>
        <p>User Count: {{ whiteboardStore.userCount() }}</p>
        <div class="mt-2 space-x-2">
          <button
            type="button"
            (click)="setRoom()"
            class="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Join Room (via WebSocket)
          </button>
          <button
            type="button"
            (click)="addTestEvent()"
            class="px-4 py-2 bg-indigo-500 text-white rounded"
          >
            Send Test Event (via WebSocket)
          </button>
          <button
            type="button"
            (click)="clearWhiteboard()"
            class="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Clear All
          </button>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestStoresComponent implements OnInit, OnDestroy {
  connectionStore = inject(ConnectionStore);
  userStore = inject(UserStore);
  whiteboardStore = inject(WhiteboardStore);
  websocketService = inject(WebSocketService);
  eventService = inject(EventService);
  
  private subscriptions = new Subscription();

  constructor() {
    effect(() => {
      console.log('Connection status:', this.connectionStore.connectionStatus());
    });
  }

  ngOnInit(): void {
    // Subscribe to WebSocket messages and process them via EventService
    this.subscriptions.add(
      this.websocketService.roomJoined$.subscribe(message => {
        console.log('ROOM_JOINED received:', message);
        this.eventService.processMessage(message);
      })
    );

    this.subscriptions.add(
      this.websocketService.events$.subscribe(message => {
        console.log('EVENT received:', message);
        this.eventService.processMessage(message);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  connect(): void {
    this.websocketService.connect();
  }

  disconnect(): void {
    this.websocketService.disconnect();
  }

  setTestUser(): void {
    const userId = this.userStore.generateUserId();
    this.userStore.setUser(userId, 'Test User');
  }

  clearUser(): void {
    this.userStore.clearUser();
  }

  setRoom(): void {
    const roomId = 'test-room-123';
    const userId = this.userStore.userId();
    
    if (!userId) {
      alert('Please set a user first');
      return;
    }
    
    if (!this.connectionStore.isConnected()) {
      alert('Please connect to WebSocket first');
      return;
    }
    
    // Send JOIN_ROOM message to server
    this.websocketService.joinRoom(roomId, userId);
  }

  addTestEvent(): void {
    const userId = this.userStore.userId();
    const roomId = this.whiteboardStore.currentRoom();
    
    if (!userId) {
      alert('Please set a user first');
      return;
    }
    
    if (!roomId) {
      alert('Please join a room first');
      return;
    }
    
    if (!this.connectionStore.isConnected()) {
      alert('Please connect to WebSocket first');
      return;
    }
    
    // Create and send event to server via WebSocket
    const event = {
      type: 'DRAW_LINE',
      userId,
      roomId,
      timestamp: Date.now(),
      points: [[Math.random() * 100, Math.random() * 100], [Math.random() * 100, Math.random() * 100]],
      color: '#000000',
      strokeWidth: 2,
    };
    
    // Send to server (server will broadcast back and update store via EventService)
    this.websocketService.send(event);
  }

  clearWhiteboard(): void {
    this.whiteboardStore.reset();
  }
}

