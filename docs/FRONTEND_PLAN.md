# SquiggleSync Frontend Development Plan

This document outlines the complete plan for building the Angular frontend for SquiggleSync using **Angular 21** with modern features like **signals**, **signal-based state management**, and **standalone components**.

---

## Table of Contents

1. [Overview](#overview)
2. [Modern Angular Features](#modern-angular-features)
3. [File Structure](#file-structure)
4. [Build Phases](#build-phases)
5. [Task Breakdown](#task-breakdown)
6. [Testing Strategy](#testing-strategy)
7. [Integration Points](#integration-points)

---

## Overview

### Goals
- Build a real-time collaborative whiteboard using Angular 21
- Use **signals** for reactive state management
- Connect to WebSocket backend for real-time synchronization
- Implement optimistic UI updates
- Handle concurrent drawing from multiple users
- Reconstruct canvas state from events

### Key Concepts
- **Event-Based Rendering**: Reconstruct canvas from events, not full state
- **Optimistic Updates**: Show user's drawing immediately, sync with server
- **Signals**: Use signals for reactive state (instead of RxJS where possible)
- **Signal-Based Services**: Services expose signals for state
- **Computed Signals**: Derived state from base signals
- **Canvas API**: HTML5 Canvas for drawing operations
- **State Management**: Signal-based state store for events
- **PrimeNG Aura**: UI component library with Aura preset for modern, polished design

---

## PrimeNG Aura Components

### Recommended PrimeNG Components for SquiggleSync

**Toolbar:**
- `p-button` / `p-buttonGroup` - Tool selection (Pen, Eraser, Clear)
- `p-colorPicker` - Color selection
- `p-slider` - Stroke width adjustment
- `p-splitButton` - Tool with dropdown options

**Room Management:**
- `p-inputText` - Room ID input
- `p-inputGroup` - Input with action button
- `p-button` - Create/Join room actions
- `p-message` - Success/error notifications
- `p-dialog` - Room creation modal

**Connection Status:**
- `p-tag` - Connection status badge
- `p-badge` - Connection indicator
- `p-toast` - Reconnection notifications
- `p-progressSpinner` - Loading states

**Layout:**
- `p-card` - Whiteboard container
- `p-toolbar` - Main toolbar wrapper
- `p-sidebar` - Settings panel (optional)
- `p-divider` - Visual separators

**Other Useful:**
- `p-menu` - Context menus
- `p-overlayPanel` - Popover menus
- `p-confirmDialog` - Confirmation dialogs
- `p-skeleton` - Loading placeholders

---

## Modern Angular Features

### Signals for State Management
- Use `signal()` for mutable state
- Use `computed()` for derived state
- Use `effect()` for side effects (sparingly)
- Signal-based services instead of BehaviorSubjects

### Modern Component Patterns
- **Standalone components** (default in Angular 20+)
- `input()` and `output()` functions (not decorators)
- `inject()` function (not constructor injection)
- `OnPush` change detection strategy
- Modern control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)

### Service Patterns
- Signal-based state services
- `providedIn: 'root'` for singletons
- Use `inject()` for dependencies
- Combine signals with RxJS for WebSocket (signals for state, RxJS for streams)

### UI Framework
- **PrimeNG Preset Aura**: Modern, polished component library
- Use PrimeNG components for UI elements (buttons, inputs, dialogs, etc.)
- Customize design tokens for brand consistency
- Support for light/dark mode

---

## File Structure

```
squigglesync-frontend/
├── src/
│   ├── app/
│   │   ├── core/                          # Core functionality
│   │   │   ├── models/
│   │   │   │   ├── events.model.ts        # Event type definitions (shared with backend)
│   │   │   │   ├── server-message.model.ts # Server message types
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── store/                     # Signal-based state store
│   │   │   │   ├── whiteboard.store.ts    # Whiteboard state (events, room, etc.)
│   │   │   │   ├── connection.store.ts    # WebSocket connection state
│   │   │   │   └── user.store.ts          # User/session state
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── websocket.service.ts   # WebSocket connection (RxJS streams)
│   │   │   │   ├── canvas.service.ts      # Canvas rendering logic
│   │   │   │   └── event.service.ts       # Event processing & replay
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── canvas.util.ts         # Canvas utility functions
│   │   │       └── event.util.ts          # Event utility functions
│   │   │
│   │   ├── features/
│   │   │   ├── whiteboard/
│   │   │   │   ├── whiteboard.component.ts      # Standalone component
│   │   │   │   ├── whiteboard.component.html
│   │   │   │   ├── whiteboard.component.scss
│   │   │   │   └── whiteboard.component.spec.ts
│   │   │   │
│   │   │   └── toolbar/
│   │   │       ├── toolbar.component.ts         # Standalone component
│   │   │       ├── toolbar.component.html
│   │   │       ├── toolbar.component.scss
│   │   │       └── toolbar.component.spec.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── room-selector/
│   │   │   │   │   ├── room-selector.component.ts    # Standalone
│   │   │   │   │   ├── room-selector.component.html
│   │   │   │   │   └── room-selector.component.scss
│   │   │   │   │
│   │   │   │   └── connection-status/
│   │   │   │       ├── connection-status.component.ts # Standalone
│   │   │   │       ├── connection-status.component.html
│   │   │   │       └── connection-status.component.scss
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   │
│   ├── environments/
│   │   ├── environment.ts                 # Development config
│   │   └── environment.prod.ts            # Production config
│   │
│   ├── styles/
│   │   ├── _variables.scss                # SCSS variables
│   │   ├── _mixins.scss                   # SCSS mixins
│   │   ├── _prime-ng-overrides.scss       # PrimeNG token overrides
│   │   └── styles.scss                    # Global styles (imports PrimeNG)
│   │
│   ├── index.html
│   └── main.ts
│
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Build Phases

### Phase 1: Foundation (Setup & Models)
**Goal**: Set up project structure and define data models

**Tasks**:
1. ✅ Angular project already initialized
2. Install and configure PrimeNG with Aura preset
3. Create models (events, server messages)
4. Set up environment configuration
5. Create basic routing structure

**Deliverables**:
- PrimeNG Aura theme configured
- Event type definitions matching backend
- Environment config with WebSocket URL
- Basic app routing

---

### Phase 2: Core Services & Signal Store (WebSocket & State)
**Goal**: Build core services and signal-based state store

**Tasks**:
1. Signal-Based State Store
   - `whiteboard.store.ts` - Events, room state (using signals)
   - `connection.store.ts` - Connection status (using signals)
   - `user.store.ts` - User/session (using signals)
   - Computed signals for derived state

2. WebSocket Service
   - Connection management (RxJS for streams)
   - Message sending/receiving
   - Update connection store signals
   - Reconnection logic

3. Event Service
   - Event processing
   - Event transformation
   - Event validation
   - Update whiteboard store signals

**Deliverables**:
- Signal-based state store working
- WebSocket connection working
- Can send/receive messages
- State updates reactively via signals

---

### Phase 3: Canvas Rendering
**Goal**: Implement canvas drawing and rendering

**Tasks**:
1. Canvas Service
   - Canvas initialization
   - Drawing operations (line, path, erase)
   - Canvas clearing
   - Event-to-canvas rendering

2. Canvas Utilities
   - Coordinate transformations
   - Drawing helpers
   - Canvas state management

**Deliverables**:
- Canvas renders on screen
- Can draw basic shapes
- Events can be rendered to canvas

---

### Phase 4: User Interaction
**Goal**: Capture user input and convert to events

**Tasks**:
1. Mouse/Touch Event Handling
   - mousedown, mousemove, mouseup
   - touchstart, touchmove, touchend
   - Coordinate capture

2. Drawing Tools
   - Pen/Draw tool
   - Eraser tool
   - Clear canvas

3. Toolbar Component
   - Tool selection
   - Color picker
   - Stroke width selector

**Deliverables**:
- User can draw on canvas
- Mouse/touch events captured
- Drawing converted to events

---

### Phase 5: Real-Time Synchronization
**Goal**: Connect user interaction to WebSocket and sync with server

**Tasks**:
1. Event Flow Integration
   - User draws → Generate event → Send via WebSocket
   - Receive event → Process → Render to canvas
   - Optimistic updates (show immediately)

2. State Synchronization
   - Join room → Receive state snapshot
   - Reconstruct canvas from events
   - Handle incremental updates

3. Error Handling
   - Connection errors
   - Event processing errors
   - Reconnection handling

**Deliverables**:
- Real-time drawing syncs between clients
- Optimistic updates work
- State reconstruction works

---

### Phase 6: UI/UX Polish
**Goal**: Improve user experience and visual design

**Tasks**:
1. Room Management UI
   - Room selector/creator
   - Room URL sharing
   - Active users display

2. Connection Status
   - Connection indicator
   - Reconnection notifications
   - Error messages

3. Styling & Layout
   - Modern UI design
   - Responsive layout
   - Loading states

**Deliverables**:
- Polished, production-ready UI
- Good user experience
- Responsive design

---

## Task Breakdown

### Phase 1: Foundation

#### Task 1.1: Install and Configure PrimeNG Aura
- [ ] Install PrimeNG dependencies:
  ```bash
  npm install primeng @primeuix/themes primeicons
  ```
- [ ] Configure PrimeNG in `app.config.ts`:
  ```typescript
  import { providePrimeNG } from 'primeng/config';
  import Aura from '@primeuix/themes/aura';
  
  export const appConfig: ApplicationConfig = {
    providers: [
      providePrimeNG({
        theme: {
          preset: Aura,
          options: {
            darkModeSelector: '.app-dark', // For dark mode toggle
            cssLayer: false
          }
        }
      })
    ]
  };
  ```
- [ ] Import PrimeNG styles in `styles.scss`:
  ```scss
  @import 'primeng/resources/themes/aura-light-blue/theme.css';
  @import 'primeng/resources/primeng.css';
  @import 'primeicons/primeicons.css';
  ```
- [ ] Test PrimeNG components render correctly

**Testing**: Verify PrimeNG components work, theme loads correctly

---

#### Task 1.2: Create Event Models
- [ ] Create `core/models/events.model.ts`
  - Copy/adapt event interfaces from backend
  - `BaseEvent`, `DrawLineEvent`, `DrawPathEvent`, `EraseEvent`, `ClearCanvasEvent`
  - `WhiteboardEvent` union type
  - Use TypeScript strict types
- [ ] Create `core/models/server-message.model.ts`
  - `ServerMessage` interface
  - Message type unions (not enums for better type safety)
- [ ] Export from `core/models/index.ts`

**Testing**: Verify types compile correctly with strict mode

---

#### Task 1.3: Environment Configuration
- [ ] Create `environments/environment.ts`
  - `websocketUrl: 'ws://localhost:3000'`
  - `apiUrl: 'http://localhost:3000/api'`
- [ ] Create `environments/environment.prod.ts`
  - Production WebSocket URL
  - Production API URL
- [ ] Update `angular.json` to use environment files

**Testing**: Verify environment variables are accessible

---

#### Task 1.4: Basic Routing
- [ ] Create `app.routes.ts`
  - Use standalone route components
  - `/` → Home/Landing page
  - `/whiteboard/:roomId` → Whiteboard component (lazy load)
  - `/whiteboard` → Whiteboard with new room
- [ ] Create basic components structure
  - All components standalone
  - Use `inject()` for dependencies
- [ ] Test routing works

**Testing**: Navigate between routes, lazy loading works

---

### Phase 2: Core Services

#### Task 2.1: Signal-Based State Store
- [ ] Create `core/store/whiteboard.store.ts`
  - `events = signal<WhiteboardEvent[]>([])`
  - `currentRoom = signal<string | null>(null)`
  - `lastSequence = computed(() => ...)`
  - `addEvent(event: WhiteboardEvent): void`
  - `clearEvents(): void`
- [ ] Create `core/store/connection.store.ts`
  - `isConnected = signal<boolean>(false)`
  - `connectionStatus = signal<'connected' | 'disconnected' | 'connecting'>('disconnected')`
  - `sessionId = signal<string | null>(null)`
- [ ] Create `core/store/user.store.ts`
  - `userId = signal<string>('')`
  - `userName = signal<string>('')`
- [ ] Use `computed()` for derived state

**Testing**:
- Store updates reactively
- Computed signals update correctly
- State persists during component lifecycle

---

#### Task 2.2: WebSocket Service
- [ ] Create `core/services/websocket.service.ts`
  - Use RxJS `Subject` for WebSocket messages
  - `connect(roomId: string): Observable<ServerMessage>`
  - `send(message: any): void`
  - `disconnect(): void`
  - Update `connection.store` signals on connection changes
- [ ] Handle connection lifecycle
  - Connect on service init
  - Reconnect on disconnect
  - Handle errors
  - Update connection store signals
- [ ] Convert WebSocket messages to RxJS observables
- [ ] Bridge RxJS streams to signal updates

**Testing**:
- Connect to backend WebSocket
- Send JOIN_ROOM message
- Receive CONNECTED response
- Connection store signals update
- Test reconnection

---

#### Task 2.3: Event Service
- [ ] Create `core/services/event.service.ts`
  - `processIncomingEvent(event: WhiteboardEvent): void`
    - Update `whiteboard.store` signals
  - `createDrawLineEvent(points, color, strokeWidth): DrawLineEvent`
  - `createEraseEvent(region): EraseEvent`
  - `createClearCanvasEvent(): ClearCanvasEvent`
- [ ] Event creation helpers
- [ ] Event validation
- [ ] Update whiteboard store when processing events

**Testing**:
- Create events with correct structure
- Validate events before sending
- Store signals update when events processed

---

### Phase 3: Canvas Rendering

#### Task 3.1: Canvas Service
- [ ] Create `core/services/canvas.service.ts`
  - `initialize(canvas: HTMLCanvasElement): void`
  - `drawLine(points, color, strokeWidth): void`
  - `drawPath(path, color, strokeWidth): void`
  - `erase(region): void`
  - `clear(): void`
  - `renderEvent(event: WhiteboardEvent): void`
- [ ] Canvas context management
- [ ] Drawing operations

**Testing**:
- Initialize canvas
- Draw lines manually
- Render events to canvas
- Clear canvas

---

#### Task 3.2: Canvas Utilities
- [ ] Create `core/utils/canvas.util.ts`
  - `getCanvasCoordinates(event, canvas): [number, number]`
  - `normalizeCoordinates(x, y, canvas): [number, number]`
  - `getBoundingRect(points): {x, y, width, height}`
- [ ] Coordinate transformation helpers

**Testing**: Test coordinate calculations

---

### Phase 4: User Interaction

#### Task 4.1: Whiteboard Component - Basic Structure
- [ ] Create `features/whiteboard/whiteboard.component.ts`
  - Use `@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })`
  - Use `inject()` for services
  - Inject `WhiteboardStore`, `CanvasService`
- [ ] Create `features/whiteboard/whiteboard.component.html`
  - Canvas element with `#canvas` template reference
  - Use `@if` for conditional rendering
  - Use signal bindings
- [ ] Initialize canvas on component init
- [ ] Use `effect()` to react to store changes

**Testing**: Canvas renders on screen

---

#### Task 4.2: Mouse/Touch Event Handling
- [ ] Implement mouse event handlers
  - `onMouseDown(event: MouseEvent)`
  - `onMouseMove(event: MouseEvent)`
  - `onMouseUp(event: MouseEvent)`
- [ ] Implement touch event handlers
  - `onTouchStart(event: TouchEvent)`
  - `onTouchMove(event: TouchEvent)`
  - `onTouchEnd(event: TouchEvent)`
- [ ] Track drawing state (isDrawing, currentPoints)

**Testing**:
- Mouse events captured
- Touch events work on mobile
- Drawing state tracked correctly

---

#### Task 4.3: Drawing Implementation
- [ ] Implement drawing logic
  - Start drawing on mousedown/touchstart
  - Add points on mousemove/touchmove
  - Finish drawing on mouseup/touchend
- [ ] Generate DRAW_LINE events
- [ ] Optimistic update (draw immediately on canvas)
- [ ] Send event via WebSocket

**Testing**:
- User can draw on canvas
- Drawing appears immediately (optimistic)
- Event sent to server

---

#### Task 4.4: Toolbar Component
- [ ] Create `features/toolbar/toolbar.component.ts`
  - Use `@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })`
  - Import PrimeNG modules: `Button`, `ColorPicker`, `Slider`, `ButtonGroup`
  - Use `input()` for tool selection
  - Use `output()` for tool changes
  - Use signals for local state (selectedTool, color, strokeWidth)
- [ ] Create `features/toolbar/toolbar.component.html`
  - Use PrimeNG `p-button` for tool selection (Pen, Eraser, Clear)
  - Use PrimeNG `p-colorPicker` for color selection
  - Use PrimeNG `p-slider` for stroke width
  - Use `p-buttonGroup` for tool grouping
  - Use `@if` and `@for` for rendering
- [ ] Style with PrimeNG Aura theme tokens
- [ ] Use signals for reactive tool state

**Testing**:
- Select different tools
- Change color
- Change stroke width
- Tools affect drawing
- Signals update reactively
- PrimeNG components styled correctly

---

### Phase 5: Real-Time Synchronization

#### Task 5.1: WebSocket Integration
- [ ] Connect WebSocket service to whiteboard component
  - Use `inject(WebSocketService)`
  - Use `inject(WhiteboardStore)`
- [ ] Join room on component init
  - Update `whiteboard.store.currentRoom` signal
- [ ] Handle ROOM_JOINED message
  - Receive state snapshot
  - Update `whiteboard.store.events` signal
  - Use `effect()` to react to events signal changes
  - Reconstruct canvas from events
- [ ] Handle EVENT messages
  - Process incoming events
  - Update store signals
  - Use `effect()` to render new events to canvas

**Testing**:
- Join room successfully
- Receive state snapshot
- Store signals update
- Canvas reconstructed from events
- Receive events from other clients
- Reactive updates work

---

#### Task 5.2: Event Flow with Signals
- [ ] Complete event flow:
  1. User draws → Generate event
  2. Optimistic update (draw immediately + update store signal)
  3. Send event via WebSocket
  4. Receive processed event back
  5. Update `whiteboard.store.events` signal (if not duplicate)
- [ ] Handle event ordering
  - Use `computed()` to sort events by sequence
- [ ] Handle duplicate events (from own optimistic update)
  - Check if event already in store before adding
- [ ] Use `effect()` to reactively render events to canvas

**Testing**:
- Draw on one client
- See drawing on another client
- Events processed in order
- No duplicate rendering
- Signals update reactively

---

#### Task 5.3: State Reconstruction
- [ ] Implement state reconstruction on room join
  - Receive state snapshot
  - Replay all events to canvas
  - Render in correct order
- [ ] Handle incremental updates
  - Get events after last known sequence
  - Apply new events

**Testing**:
- Join room with existing drawings
- See all previous drawings
- New drawings appear correctly

---

#### Task 5.4: Error Handling
- [ ] Handle WebSocket connection errors
- [ ] Handle event processing errors
- [ ] Implement reconnection logic
- [ ] Show error messages to user

**Testing**:
- Disconnect server → See error
- Reconnect → Resume sync
- Invalid events handled gracefully

---

### Phase 6: UI/UX Polish

#### Task 6.1: Room Management
- [ ] Create `shared/components/room-selector/room-selector.component.ts`
  - Use `@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })`
  - Import PrimeNG modules: `InputText`, `Button`, `InputGroup`, `Message`
  - Use `inject(WhiteboardStore)`
  - Use signals for room ID input
  - Use `output()` to emit room changes
- [ ] Create `shared/components/room-selector/room-selector.component.html`
  - Use PrimeNG `p-inputText` for room ID input
  - Use PrimeNG `p-button` for create/join actions
  - Use PrimeNG `p-inputGroup` for input with button
  - Use PrimeNG `p-message` for success/error messages
  - Room URL sharing with copy button
  - Use `@if` for conditional UI
- [ ] Generate room IDs
- [ ] Share room via URL
- [ ] Update store signals when room changes
- [ ] Style with PrimeNG Aura theme

**Testing**: Create/join rooms, share URLs, store updates, PrimeNG components work

---

#### Task 6.2: Connection Status
- [ ] Create `shared/components/connection-status/connection-status.component.ts`
  - Use `@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })`
  - Import PrimeNG modules: `Tag`, `Badge`, `Toast`
  - Use `inject(ConnectionStore)`
  - Read connection signals
  - Use `computed()` for status display
- [ ] Create `shared/components/connection-status/connection-status.component.html`
  - Use PrimeNG `p-tag` for connection status (Connected/Disconnected)
  - Use PrimeNG `p-badge` for connection indicator
  - Use PrimeNG `p-toast` for reconnection notifications
  - Connection status text - bind to signal
  - Use `@if` for conditional rendering based on signal
  - Use signal bindings for reactive updates
- [ ] Show connection state reactively
- [ ] Handle reconnection UI with PrimeNG toast notifications
- [ ] Style with PrimeNG Aura theme

**Testing**: Connection status updates correctly, signals work, PrimeNG components styled

---

#### Task 6.3: Active Users (Optional)
- [ ] Display active users in room
- [ ] Show user count
- [ ] User presence indicators

**Testing**: See other users in room

---

#### Task 6.4: Styling & Layout with PrimeNG Aura
- [ ] Customize PrimeNG design tokens (if needed)
  - Override primary colors, surface colors
  - Customize component tokens
  - Set up dark mode support
- [ ] Create global styles
  - Use PrimeNG CSS variables for consistency
  - Custom SCSS for whiteboard-specific styles
- [ ] Design toolbar with PrimeNG components
- [ ] Design whiteboard layout
  - Use PrimeNG `p-card` for whiteboard container
  - Use PrimeNG layout utilities
- [ ] Responsive design
  - Use PrimeNG responsive utilities
  - Test on mobile/tablet/desktop
- [ ] Loading states
  - Use PrimeNG `p-progressSpinner` or `p-skeleton`
- [ ] Animations/transitions
  - Use PrimeNG built-in animations
  - Custom transitions for canvas updates

**Testing**: UI looks polished with PrimeNG Aura, responsive, consistent design

---

## Testing Strategy

### Unit Tests
- **Services**: Test each service in isolation
- **Components**: Test component logic
- **Utils**: Test utility functions

### Integration Tests
- **WebSocket Service**: Test connection, sending, receiving
- **Canvas Service**: Test rendering operations
- **Event Flow**: Test event creation → sending → receiving → rendering

### E2E Tests (Optional)
- **Full Flow**: Open app → Join room → Draw → See on another client
- **Reconnection**: Disconnect → Reconnect → State syncs

### Manual Testing Checklist
- [ ] Can connect to WebSocket server
- [ ] Can join a room
- [ ] Can draw on canvas
- [ ] Drawing appears immediately (optimistic)
- [ ] Drawing syncs to other clients
- [ ] Can see other users' drawings
- [ ] State reconstructs on page reload
- [ ] Reconnection works
- [ ] Error handling works

---

## Integration Points

### Backend WebSocket API

#### Connection
```
ws://localhost:3000
```

#### Messages to Send

**JOIN_ROOM**:
```json
{
  "type": "JOIN_ROOM",
  "roomId": "room-123",
  "userId": "user-456"
}
```

**DRAW_LINE**:
```json
{
  "type": "DRAW_LINE",
  "userId": "user-456",
  "roomId": "room-123",
  "points": [[10, 10], [20, 20]],
  "color": "#FF0000",
  "strokeWidth": 2
}
```

#### Messages to Receive

**CONNECTED**:
```json
{
  "type": "CONNECTED",
  "payload": {
    "sessionId": "...",
    "message": "Connected to SquiggleSync server"
  }
}
```

**ROOM_JOINED**:
```json
{
  "type": "ROOM_JOINED",
  "payload": {
    "roomId": "room-123",
    "userCount": 2,
    "state": [...],
    "stateEventCount": 5
  }
}
```

**EVENT**:
```json
{
  "type": "EVENT",
  "payload": {
    "type": "DRAW_LINE",
    "userId": "user-456",
    "roomId": "room-123",
    "points": [[10, 10], [20, 20]],
    "color": "#FF0000",
    "strokeWidth": 2,
    "timestamp": 1234567890,
    "sequence": 42
  }
}
```

**ERROR**:
```json
{
  "type": "ERROR",
  "error": "Error message"
}
```

---

## Build Order Summary

1. **Foundation** → Models, Environment, Routing
2. **WebSocket Service** → Connection, Messaging
3. **State Service** → Local event storage
4. **Canvas Service** → Rendering logic
5. **Whiteboard Component** → Basic structure
6. **User Interaction** → Mouse/touch, drawing
7. **Real-Time Sync** → WebSocket integration
8. **UI Polish** → Styling, room management

---

## Key Implementation Notes

### PrimeNG Aura Theming
- Use design tokens to customize colors, spacing, typography
- Override tokens in `app.config.ts` using `definePreset()` or `updatePreset()`
- Support light/dark mode using `darkModeSelector`
- Use component tokens for component-specific customization
- Avoid overriding CSS classes directly - use design tokens instead

### Signal-Based State Management
- Use `signal()` for mutable state (events, connection status, user)
- Use `computed()` for derived state (sorted events, connection display)
- Use `effect()` sparingly for side effects (canvas rendering)
- Update signals with `update()` or `set()`, never `mutate()`
- Store signals in services with `providedIn: 'root'`

### Optimistic Updates
- Draw immediately when user draws
- Update store signal immediately (optimistic)
- Send event to server
- When server responds, check if event already exists (by sequence)
- Don't re-render if event is from own optimistic update

### Event Ordering
- Events have sequence numbers from server
- Use `computed()` to create sorted events signal
- Always render events in sequence order
- Handle out-of-order events (insert in correct position in store)

### State Reconstruction
- On room join, receive state snapshot
- Update `whiteboard.store.events` signal with snapshot
- Use `effect()` to react to events signal and replay to canvas
- Then listen for new events and update store

### Performance
- Throttle mouse move events (don't send every pixel)
- Batch points for smooth drawing
- Use requestAnimationFrame for canvas updates
- OnPush change detection for all components
- Signals are more performant than observables for simple state

---

## Dependencies

### Already Installed (Angular 21)
- `@angular/core` - Signals, computed, effect
- `@angular/common` - Common directives
- `@angular/router` - Routing
- `rxjs` - For WebSocket streams (combined with signals)

### PrimeNG Aura (To Install)
```bash
npm install primeng @primeuix/themes primeicons
```

**Dependencies:**
- `primeng` - PrimeNG component library
- `@primeuix/themes` - PrimeNG theme system (includes Aura preset)
- `primeicons` - PrimeNG icon library

**No other dependencies needed!**

### Signal API Usage
```typescript
// Create signal
const events = signal<WhiteboardEvent[]>([]);

// Update signal
events.update(current => [...current, newEvent]);
events.set([...events(), newEvent]);

// Computed signal
const sortedEvents = computed(() => 
  [...events()].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
);

// Effect (side effects)
effect(() => {
  const evts = sortedEvents();
  renderEventsToCanvas(evts);
});
```

### PrimeNG Aura Setup
```typescript
// app.config.ts
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: false
        }
      }
    })
  ]
};
```

```scss
// styles.scss
@import 'primeng/resources/themes/aura-light-blue/theme.css';
@import 'primeng/resources/primeng.css';
@import 'primeicons/primeicons.css';
```

### PrimeNG Component Usage Example
```typescript
// toolbar.component.ts
import { Button } from 'primeng/button';
import { ColorPicker } from 'primeng/colorpicker';
import { Slider } from 'primeng/slider';

@Component({
  standalone: true,
  imports: [Button, ColorPicker, Slider],
  // ...
})
```

```html
<!-- toolbar.component.html -->
<p-button label="Pen" (onClick)="selectTool('pen')" />
<p-colorPicker [(ngModel)]="color" />
<p-slider [(ngModel)]="strokeWidth" [min]="1" [max]="20" />
```

---

## Success Criteria

✅ User can draw on canvas  
✅ Drawing appears immediately (optimistic update)  
✅ Drawing syncs to other clients in real-time  
✅ Multiple users can draw simultaneously  
✅ Canvas state reconstructs on page reload  
✅ Connection errors handled gracefully  
✅ UI is polished and responsive with PrimeNG Aura  
✅ Consistent design system using PrimeNG components  
✅ Dark mode support (optional)  

---

## Next Steps After Frontend

1. Add Redis Pub/Sub for horizontal scaling
2. Add authentication
3. Add user presence (cursors)
4. Add undo/redo
5. Add export functionality
6. Deploy to production

---

**Ready to start building!** 🚀

Follow the same test-as-you-build approach:
1. Create service/component
2. Test it in isolation
3. Integrate with other parts
4. Test integration
5. Move to next task

