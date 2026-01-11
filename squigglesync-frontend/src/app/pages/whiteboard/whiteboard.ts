import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { Button } from 'primeng/button';
import { ColorPicker } from 'primeng/colorpicker';
import { Slider } from 'primeng/slider';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { Badge } from 'primeng/badge';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';

type DrawingTool = 'pen' | 'eraser' | 'clear';
type ConnectionSeverity = 'success' | 'danger';
type TagIcon = 'pi pi-check-circle' | 'pi pi-times-circle';

@Component({
  selector: 'app-whiteboard',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    ColorPicker,
    Slider,
    Tag,
    Divider,
    InputTextModule,
    Badge,
    Tooltip,
    Dialog
  ],
  templateUrl: './whiteboard.html',
  styleUrl: './whiteboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Whiteboard {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Tool selection
  selectedTool = signal<DrawingTool>('pen');
  
  // Drawing settings
  color = signal<string>('#000000');
  strokeWidth = signal<number>(3);
  
  // Room info
  roomId = signal<string>('');
  userName = signal<string>('');
  userCount = signal<number>(1);
  isConnected = signal<boolean>(false);
  
  // Modal state
  showNameModal = signal<boolean>(false);
  nameInput = signal<string>('');
  roomLink = signal<string>('');
  linkCopied = signal<boolean>(false);
  
  // Computed signals
  connectionStatus = computed<string>(() => 
    this.isConnected() ? 'Connected' : 'Disconnected'
  );
  
  connectionSeverity = computed<ConnectionSeverity>(() => 
    this.isConnected() ? 'success' : 'danger'
  );
  
  connectionIcon = computed<TagIcon>(() => 
    this.isConnected() ? 'pi pi-check-circle' : 'pi pi-times-circle'
  );
  
  penToolSelected = computed<boolean>(() => this.selectedTool() === 'pen');
  
  // Sidebar visibility
  sidebarVisible = signal<boolean>(true);

  // Convert route params to signal
  private routeParams = toSignal(this.route.paramMap);

  // Computed class bindings for tool buttons
  penButtonClasses = computed(() => {
    const base = 'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer';
    return this.selectedTool() === 'pen'
      ? `${base} bg-primary text-white border-primary shadow-md tool-button active`
      : `${base} bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100 tool-button`;
  });

  eraserButtonClasses = computed(() => {
    const base = 'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer';
    return this.selectedTool() === 'eraser'
      ? `${base} bg-primary text-white border-primary shadow-md tool-button active`
      : `${base} bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100 tool-button`;
  });

  clearButtonClasses = computed(() => {
    const base = 'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer';
    return this.selectedTool() === 'clear'
      ? `${base} bg-primary text-white border-primary shadow-md tool-button active`
      : `${base} bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100 tool-button`;
  });

  sidebarToggleClasses = computed(() => {
    const base = 'bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm transition-colors cursor-pointer';
    return this.sidebarVisible() 
      ? `${base} text-primary`
      : `${base} text-surface-600`;
  });

  constructor() {
    // Effect to handle route param changes
    effect(() => {
      const params = this.routeParams();
      if (!params) {
        this.showNameModal.set(true);
        return;
      }

      const id = params.get('roomId') || null;
      
      if (id) {
        this.roomId.set(id);
        // If roomId exists, check if user name is set
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedName = window.localStorage.getItem(`userName_${id}`);
          if (storedName) {
            this.userName.set(storedName);
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
  }

  // Methods
  selectTool(tool: DrawingTool): void {
    this.selectedTool.set(tool);
  }
  
  updateColor(newColor: string): void {
    this.color.set(newColor);
  }
  
  updateStrokeWidth(newWidth: number): void {
    const clampedValue = Math.max(1, Math.min(20, newWidth));
    this.strokeWidth.set(clampedValue);
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
  
  toggleSidebar(): void {
    this.sidebarVisible.update(visible => !visible);
  }

  // Generate mock room ID
  private generateRoomId(): string {
    return `room-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Handle name submission
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

    // Store user name
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`userName_${roomId}`, name);
    }

    // Generate room link
    if (typeof window !== 'undefined' && window.location) {
      const link = `${window.location.origin}/whiteboard/${roomId}`;
      this.roomLink.set(link);
    }

    // Connect (mock)
    this.isConnected.set(true);
    
    // Keep modal open to show room link
    // User can close it manually
  }

  // Close modal
  closeModal(): void {
    this.showNameModal.set(false);
  }
}