import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { Badge } from 'primeng/badge';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';

// Services & Utils
import { CanvasService } from '../../core/services/canvas.service';
import { WhiteboardStore } from '../../core/store/whiteboard.store';
import { getCanvasCoordinates } from '../../core/utils/canvas.util';
import { EventService } from '../../core/services/event.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { UserStore } from '../../core/store/user.store';
import { ConnectionStore } from '../../core/store/connection.store';
import { getBoundingRect } from '../../core/utils/canvas.util';
import { EventMessage, RoomJoinedMessage } from '@app/core/models/server-message.model';
import { ToolbarComponent } from '../../features';

type DrawingTool = 'pen' | 'eraser' | 'clear';
type ConnectionSeverity = 'success' | 'danger';
type TagIcon = 'pi pi-check-circle' | 'pi pi-times-circle';

@Component({
  selector: 'app-whiteboard',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Tag,
    Divider,
    InputTextModule,
    Badge,
    Tooltip,
    Dialog,
    ToolbarComponent
  ],
  templateUrl: './whiteboard.html',
  styleUrl: './whiteboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Whiteboard {
  // ============================================================================
  // DEPENDENCIES
  // ============================================================================
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private canvasService = inject(CanvasService);
  private whiteboardStore = inject(WhiteboardStore);
  private routeParams = toSignal(this.route.paramMap);
  private eventService = inject(EventService);
  private wsService = inject(WebSocketService);
  private userStore = inject(UserStore);
  private connectionStore = inject(ConnectionStore);

  // ============================================================================
  // TEMPLATE REFERENCES
  // ============================================================================
  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  // ============================================================================
  // CANVAS STATE
  // ============================================================================
  canvasWidth = signal<number>(0);
  canvasHeight = signal<number>(0);
  private isDrawing = signal<boolean>(false);
  private currentPoints = signal<[number, number][]>([]);

  // ============================================================================
  // DRAWING TOOLS & SETTINGS
  // ============================================================================
  selectedTool = signal<DrawingTool>('pen');
  color = signal<string>('#000000');
  strokeWidth = signal<number>(3);
  eraserSize = signal<number>(10); // Separate eraser size (in pixels)

  // ============================================================================
  // ROOM & CONNECTION STATE
  // ============================================================================
  roomId = signal<string>('');
  userName = signal<string>('');
  userCount = signal<number>(1);
  isConnected = signal<boolean>(false);

  // ============================================================================
  // UI STATE
  // ============================================================================
  showNameModal = signal<boolean>(false);
  nameInput = signal<string>('');
  roomLink = signal<string>('');
  linkCopied = signal<boolean>(false);
  sidebarVisible = signal<boolean>(true);

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================
  connectionStatus = computed<string>(() => 
    this.isConnected() ? 'Connected' : 'Disconnected'
  );

  connectionSeverity = computed<ConnectionSeverity>(() => 
    this.isConnected() ? 'success' : 'danger'
  );

  connectionIcon = computed<TagIcon>(() => 
    this.isConnected() ? 'pi pi-check-circle' : 'pi pi-times-circle'
  );

  sidebarToggleClasses = computed(() => {
    const base = 'bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm transition-colors cursor-pointer';
    return this.sidebarVisible() 
      ? `${base} text-primary`
      : `${base} text-surface-600`;
  });

  /**
   * Computed signal: Get cursor class based on selected tool
   * 
   * Returns appropriate cursor class for the current tool.
   * - Pen tool: crosshair cursor
   * - Eraser tool: custom eraser cursor (SVG icon)
   */
  canvasCursor = computed<string>(() => {
    const tool = this.selectedTool();
    if (tool === 'eraser') {
      return 'cursor-eraser';
    }
    return 'cursor-crosshair';
  });

  // ============================================================================
  // CONSTRUCTOR & INITIALIZATION
  // ============================================================================
  constructor() {
    // Initialize canvas after view is ready
    afterNextRender(() => {
      this.initializeCanvas();
    });

    this.wsService.connect();

    this.wsService.roomJoined$.subscribe((message: RoomJoinedMessage) => {
      this.eventService.processMessage(message);
    })

    this.wsService.events$.subscribe((message: EventMessage) => {
      this.eventService.processMessage(message);
    })

    // React to events changes and re-render canvas
    effect(() => {
      const events = this.whiteboardStore.sortedEvents();
      if (this.canvasService.isReady() && events.length > 0) {
        this.canvasService.renderAllEvents(events);
      }
    });

    // Handle window resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateCanvasSize();
      });
    }

    // Handle route param changes (room ID)
    effect(() => {
      const params = this.routeParams();
      if (!params) {
        this.showNameModal.set(true);
        return;
      }

      const id = params.get('roomId') || null;
      
      if (id) {
        this.roomId.set(id);
        this.whiteboardStore.setRoom(id);

        // Check if user name is stored for this room
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedName = window.localStorage.getItem(`userName_${id}`);
          if (storedName) {
            this.userName.set(storedName);
                    // TODO Phase 5: Set user via UserStore
            this.isConnected.set(true);
          } else {
            this.showNameModal.set(true);
          }
        }
      } else {
        // No roomId in route, show modal to create room
        this.showNameModal.set(true);
      }
    });

    // Join room when connected
    effect(() => {
      const isConnected = this.connectionStore.isConnected();
      const roomId = this.whiteboardStore.currentRoom();
      const userId = this.userStore.userId();

      if (isConnected && roomId && userId) {
        this.wsService.joinRoom(roomId, userId);
      }
    });
  }

  // ============================================================================
  // CANVAS METHODS
  // ============================================================================

  /**
   * Initialize the canvas
   * 
   * Sets up canvas element, dimensions, and drawing service.
   */
  private initializeCanvas(): void {
    const canvasElement = this.canvasRef()?.nativeElement;
    if (!canvasElement) {
      console.error('Canvas element not found');
      return;
    }

    this.updateCanvasSize();
    this.canvasService.initialize(canvasElement);
    
    // Render existing events from store
    const events = this.whiteboardStore.sortedEvents();
    if (events.length > 0) {
      this.canvasService.renderAllEvents(events);
    }
  }

  /**
   * Update canvas size to match container
   * 
   * Sets canvas dimensions to match viewport size.
   * Accounts for device pixel ratio for crisp rendering.
   */
  private updateCanvasSize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvasWidth.set(width);
    this.canvasHeight.set(height);

    const canvasElement = this.canvasRef()?.nativeElement;
    if (canvasElement) {
      const dpr = window.devicePixelRatio || 1;
      canvasElement.width = width * dpr;
      canvasElement.height = height * dpr;

      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }
  }

  // ============================================================================
  // MOUSE EVENT HANDLERS
  // ============================================================================

  /**
   * Handle mouse down event
   * 
   * Starts drawing when user presses mouse button.
   */
  onMouseDown(event: MouseEvent): void {
    if (!this.canvasService.isReady()) {
      return;
    }

    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      return;
    }

    const [x, y] = getCanvasCoordinates(event, canvas);
    this.isDrawing.set(true);
    this.currentPoints.set([[x, y]]);
  }

  /**
   * Handle mouse move event
   * 
   * Adds points to current drawing while mouse is pressed.
   * Draws optimistically (will be replaced by event rendering in Phase 4).
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing() || !this.canvasService.isReady()) {
      return;
    }

    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      return;
    }

    const [x, y] = getCanvasCoordinates(event, canvas);
    this.currentPoints.update(points => [...points, [x, y]]);


  // Draw optimistically based on selected tool
    const tool = this.selectedTool();
    const points = this.currentPoints();
  
    if (tool === 'pen' && points.length >= 2) {
      const lastTwo = points.slice(-2);
      this.canvasService.drawLine(
        lastTwo,
        this.color(),
        this.strokeWidth()
      );
    } else if (tool === 'eraser' && points.length >= 2) {
      const lastPoint = points[points.length - 1];
      const eraseSize = this.strokeWidth() * 2;
      this.canvasService.erase({
        x: lastPoint[0] - eraseSize / 2,
        y: lastPoint[1] - eraseSize / 2,
        width: eraseSize,
        height: eraseSize
      });
    }
  }

  /**
   * Handle mouse up event
   * 
   * Finishes drawing when user releases mouse button.
   */
  onMouseUp(event: MouseEvent): void {
    if (!this.isDrawing()) {
      return;
    }
  
    this.isDrawing.set(false);
    
    const points = this.currentPoints();
    if (points.length === 0) {
      this.currentPoints.set([]);
      return;
    }
  
    const tool = this.selectedTool();
    
    // Create and send event based on tool
    if (tool === 'pen' && points.length > 0) {
      this.handleDrawLine(points);
    } else if (tool === 'eraser' && points.length > 0) {
      this.handleErase(points);
    }
  
    this.currentPoints.set([]);
  }

  // ============================================================================
  // TOUCH EVENT HANDLERS
  // ============================================================================

  /**
   * Handle touch start event
   */
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (!this.canvasService.isReady()) {
      return;
    }

    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      return;
    }

    const [x, y] = getCanvasCoordinates(event, canvas);
    this.isDrawing.set(true);
    this.currentPoints.set([[x, y]]);
  }

  /**
   * Handle touch move event
   */
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing() || !this.canvasService.isReady()) {
      return;
    }

    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      return;
    }

    const [x, y] = getCanvasCoordinates(event, canvas);
    this.currentPoints.update(points => [...points, [x, y]]);

    // Draw optimistically based on selected tool
    const tool = this.selectedTool();
    const points = this.currentPoints();
    
    if (tool === 'pen' && points.length >= 2) {
      const lastTwo = points.slice(-2);
      this.canvasService.drawLine(
        lastTwo,
        this.color(),
        this.strokeWidth()
      );
    } else if (tool === 'eraser' && points.length >= 2) {
      const lastPoint = points[points.length - 1];
      const eraseSize = this.eraserSize();
      this.canvasService.erase({
        x: lastPoint[0] - eraseSize / 2,
        y: lastPoint[1] - eraseSize / 2,
        width: eraseSize,
        height: eraseSize
      });
    }
  }

  /**
   * Handle touch end event
   * 
   */
  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing()) {
      return;
    }

    this.isDrawing.set(false);
    
    const points = this.currentPoints();
    if (points.length === 0) {
      this.currentPoints.set([]);
      return;
    }
  
    const tool = this.selectedTool();
    
    // Create and send event based on tool
    if (tool === 'pen' && points.length > 0) {
      this.handleDrawLine(points);
    } else if (tool === 'eraser' && points.length > 0) {
      this.handleErase(points);
    }

    this.currentPoints.set([]);
  }

  // ============================================================================
  // DRAWING EVENT HANDLERS
  // ============================================================================

  /**
   * Handle draw line completion
   * 
   * Creates DRAW_LINE event and sends via WebSocket.
   * Also updates store optimistically.
   */
  private handleDrawLine(points: [number, number][]): void {
    if (points.length === 0) {
      return;
    }

    const event = this.eventService.createDrawLineEvent(
      points, 
      this.color(), 
      this.strokeWidth()
    );

    // Optimistic update: Add to store immediately
    this.whiteboardStore.addEvent(event);

    // Send via WebSocket
    if (this.connectionStore.isConnected()) {
      this.wsService.send(event);
    }
  }

  /**
   * Handle erase completion
   * 
   * Creates ERASE event for the bounding rectangle of erased points.
   */
  private handleErase(points: [number, number][]): void {
    if (points.length === 0) {
      return;
    }

    // Calculate bounding rectangle for erase region
    const eraseSize = this.eraserSize();
    const boundingRect = getBoundingRect(points);
    
    // Expand region by erase size
    const region = {
      x: Math.max(0, boundingRect.x - eraseSize / 2),
      y: Math.max(0, boundingRect.y - eraseSize / 2),
      width: boundingRect.width + eraseSize,
      height: boundingRect.height + eraseSize
    };

    // Create event
    const event = this.eventService.createEraseEvent(region);

    // Optimistic update: Add to store immediately
    this.whiteboardStore.addEvent(event);

    // Send via WebSocket
    if (this.connectionStore.isConnected()) {
      this.wsService.send(event);
    }
  }

  /**
   * Handle clear canvas action
   * 
   * Creates CLEAR_CANVAS event and sends via WebSocket.
   */
  handleClearCanvas(): void {
    // Create event
    const event = this.eventService.createClearCanvasEvent();

    // Optimistic update: Clear store and add clear event
    this.whiteboardStore.clearEvents();
    this.whiteboardStore.addEvent(event);

    // Clear canvas immediately
    this.canvasService.clear();

    // Send via WebSocket
    if (this.connectionStore.isConnected()) {
      this.wsService.send(event);
    }
  }
  // ============================================================================
  // TOOL & SETTINGS METHODS
  // ============================================================================

  /**
   * Select a drawing tool
   * 
   * Sets the selected tool and handles clearing canvas if clear tool is selected.
   */
  selectTool(tool: DrawingTool): void {
    this.selectedTool.set(tool);
    
    // If clear tool selected, execute immediately
    if (tool === 'clear') {
      this.handleClearCanvas();
      // Reset to pen tool after clearing
      this.selectedTool.set('pen');
    }
  }
  
  updateColor(newColor: string): void {
    this.color.set(newColor);
  }
  
  updateStrokeWidth(newWidth: number): void {
    const clampedValue = Math.max(1, Math.min(20, newWidth));
    this.strokeWidth.set(clampedValue);
  }

  updateEraserSize(newSize: number): void {
    const clampedValue = Math.max(5, Math.min(100, newSize));
    this.eraserSize.set(clampedValue);
  }

  // ============================================================================
  // UI METHODS
  // ============================================================================

  toggleSidebar(): void {
    this.sidebarVisible.update(visible => !visible);
  }

  toggleConnection(): void {
    this.isConnected.update(connected => !connected);
  }

  copyRoomLink(): void {
    if (typeof window === 'undefined' || !window.navigator?.clipboard) {
      return;
    }

    const link = this.roomLink() || (this.roomId() ? `${window.location.origin}/whiteboard/${this.roomId()}` : '');
    if (link) {
      window.navigator.clipboard.writeText(link).then(() => {
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2000);
      }).catch(() => {
        // Handle clipboard error silently
      });
    }
  }

  // ============================================================================
  // ROOM MANAGEMENT METHODS
  // ============================================================================

  /**
   * Generate a unique room ID
   */
  private generateRoomId(): string {
    return `room-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Handle name submission and room creation
   * 
   * TODO Phase 5: Integrate with WebSocketService and UserStore
   */
  onSubmitName(): void {
    const name = this.nameInput().trim();
    if (!name) {
      return;
    }
  
    this.userName.set(name);
    
    // Generate or use existing room ID
    let roomId = this.roomId();
    if (!roomId) {
      roomId = this.generateRoomId();
      this.roomId.set(roomId);
      
      // Update URL with room ID
      this.router.navigate(['/whiteboard', roomId], { replaceUrl: true });
    }
  
    // Set user in UserStore
    const userId = this.userStore.generateUserId();
    this.userStore.setUser(userId, name);
    this.whiteboardStore.setRoom(roomId);
  
    // Store user name in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`userName_${roomId}`, name);
    }
  
    // Generate room link
    if (typeof window !== 'undefined' && window.location) {
      const link = `${window.location.origin}/whiteboard/${roomId}`;
      this.roomLink.set(link);
    }
  
    // Connection will be handled by effect when WebSocket connects
    this.isConnected.set(true);
  }

  /**
   * Close the name/room modal
   */
  closeModal(): void {
    this.showNameModal.set(false);
  }
}
