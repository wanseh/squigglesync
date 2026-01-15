import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPicker } from 'primeng/colorpicker';
import { Slider } from 'primeng/slider';

type DrawingTool = 'pen' | 'eraser' | 'clear';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, FormsModule, ColorPicker, Slider],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  selectedTool = input.required<DrawingTool>();
  color = input.required<string>();
  strokeWidth = input.required<number>();
  eraserSize = input.required<number>();

  toolChange = output<DrawingTool>();
  colorChange = output<string>();
  strokeWidthChange = output<number>();
  eraserSizeChange = output<number>();

  penToolSelected = computed(() => this.selectedTool() === 'pen');
  eraserToolSelected = computed(() => this.selectedTool() === 'eraser');

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

  // Methods
  selectTool(tool: DrawingTool): void {
    this.toolChange.emit(tool);
  }

  updateColor(newColor: string): void {
    this.colorChange.emit(newColor);
  }

  updateStrokeWidth(newWidth: number): void {
    const clampedValue = Math.max(1, Math.min(20, newWidth));
    this.strokeWidthChange.emit(clampedValue);
  }

  updateEraserSize(newSize: number): void {
    const clampedValue = Math.max(5, Math.min(100, newSize));
    this.eraserSizeChange.emit(clampedValue);
  }
}
