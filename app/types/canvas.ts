export type ElementType = 'text' | 'table' | 'group';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  rotation?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
}

export interface TableCell {
  content: string;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  columns: number;
  cells: TableCell[][];
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
}

export interface GroupElement extends BaseElement {
  type: 'group';
  children: string[]; // IDs of child elements
}

export type CanvasElement = TextElement | TableElement | GroupElement;

export interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  pan: Position;
}

export interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: Position;
  offset: Position;
}

export interface ResizeState {
  isResizing: boolean;
  elementId: string | null;
  handle: ResizeHandle | null;
  startPosition: Position;
  startSize: Size;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w';
