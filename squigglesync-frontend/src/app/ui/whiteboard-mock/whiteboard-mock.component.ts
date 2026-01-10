import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { Button } from 'primeng/button';
import { ColorPicker } from 'primeng/colorpicker';
import { Slider } from 'primeng/slider';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { Badge } from 'primeng/badge';
import { Tooltip } from 'primeng/tooltip';

type DrawingTool = 'pen' | 'eraser' | 'clear';
type ConnectionSeverity = 'success' | 'danger';
type TagIcon = 'pi pi-check-circle' | 'pi pi-times-circle';

@Component({
  selector: 'app-whiteboard-mock',
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
    Tooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whiteboard-mock.component.html',
  styleUrl: './whiteboard-mock.component.scss'
})
export class WhiteboardMockComponent {
  // Tool selection - using signals for state management
  selectedTool = signal<DrawingTool>('pen');
  
  // Drawing settings - using signals (best practice)
  color = signal<string>('#000000');
  strokeWidth = signal<number>(3);
  
  // Room info
  roomId = signal<string>('room-123');
  userCount = signal<number>(3);
  isConnected = signal<boolean>(true);
  
  // Computed signals for derived state (best practice)
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
  
  // Methods
  selectTool(tool: DrawingTool): void {
    this.selectedTool.set(tool);
  }
  
  updateColor(newColor: string): void {
    this.color.set(newColor);
  }
  
  updateStrokeWidth(newWidth: number): void {
    // Clamp value between min and max
    const clampedValue = Math.max(1, Math.min(20, newWidth));
    this.strokeWidth.set(clampedValue);
  }
  
  toggleConnection(): void {
    this.isConnected.update(connected => !connected);
  }
  
  copyRoomLink(): void {
    if (typeof window !== 'undefined' && window.location) {
      const link = `${window.location.origin}/whiteboard/${this.roomId()}`;
      navigator.clipboard.writeText(link).catch(() => {
        // Handle clipboard error silently - accessibility requirement
      });
    }
  }
  
  toggleSidebar(): void {
    this.sidebarVisible.update(visible => !visible);
  }
}

