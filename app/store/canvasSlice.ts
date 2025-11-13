import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CanvasState, CanvasElement, Position, Size, TextElement, TableElement, TableCell } from '../types/canvas';

const initialState: CanvasState = {
  elements: [],
  selectedIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    addElement: (state, action: PayloadAction<CanvasElement>) => {
      state.elements.push(action.payload);
      state.selectedIds = [action.payload.id];
    },

    updateElement: (state, action: PayloadAction<{ id: string; updates: Partial<CanvasElement> }>) => {
      const index = state.elements.findIndex((el) => el.id === action.payload.id);
      if (index !== -1) {
        state.elements[index] = { ...state.elements[index], ...action.payload.updates } as CanvasElement;
      }
    },

    deleteElement: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.elements = state.elements.filter((el) => el.id !== id);
      state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
    },

    selectElement: (state, action: PayloadAction<{ id: string; multiSelect?: boolean }>) => {
      const { id, multiSelect } = action.payload;
      if (multiSelect) {
        const isSelected = state.selectedIds.includes(id);
        if (isSelected) {
          state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
        } else {
          state.selectedIds.push(id);
        }
      } else {
        state.selectedIds = [id];
      }
    },

    clearSelection: (state) => {
      state.selectedIds = [];
    },

    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.1, Math.min(5, action.payload));
    },

    setPan: (state, action: PayloadAction<Position>) => {
      state.pan = action.payload;
    },

    moveElement: (state, action: PayloadAction<{ id: string; position: Position }>) => {
      const { id, position } = action.payload;
      const elementIndex = state.elements.findIndex((el) => el.id === id);
      if (elementIndex === -1) return;

      const element = state.elements[elementIndex];

      // If it's a group, move all children relative to the group movement
      if (element.type === 'group') {
        const deltaX = position.x - element.position.x;
        const deltaY = position.y - element.position.y;

        // Update group position
        element.position = position;

        // Update all children positions
        element.children.forEach((childId) => {
          const childIndex = state.elements.findIndex((el) => el.id === childId);
          if (childIndex !== -1) {
            state.elements[childIndex].position = {
              x: state.elements[childIndex].position.x + deltaX,
              y: state.elements[childIndex].position.y + deltaY,
            };
          }
        });
      } else {
        element.position = position;
      }
    },

    resizeElement: (state, action: PayloadAction<{ id: string; size: Size }>) => {
      const { id, size } = action.payload;
      const elementIndex = state.elements.findIndex((el) => el.id === id);
      if (elementIndex === -1) return;

      const element = state.elements[elementIndex];

      // If it's a group, resize all children proportionally
      if (element.type === 'group') {
        const scaleX = size.width / element.size.width;
        const scaleY = size.height / element.size.height;

        // Update group size
        element.size = size;

        // Update all children
        element.children.forEach((childId) => {
          const childIndex = state.elements.findIndex((el) => el.id === childId);
          if (childIndex !== -1) {
            const child = state.elements[childIndex];
            const relativeX = child.position.x - element.position.x;
            const relativeY = child.position.y - element.position.y;

            child.position = {
              x: element.position.x + relativeX * scaleX,
              y: element.position.y + relativeY * scaleY,
            };
            child.size = {
              width: child.size.width * scaleX,
              height: child.size.height * scaleY,
            };

            // Scale font size for text elements
            if (child.type === 'text') {
              const textChild = child as TextElement;
              textChild.fontSize = Math.max(8, Math.round(textChild.fontSize * scaleY));
            }
          }
        });
      } else {
        // Calculate scale factor for individual element resize
        const scaleY = size.height / element.size.height;

        // Update element size
        element.size = size;

        // Scale font size for text elements
        if (element.type === 'text') {
          const textElement = element as TextElement;
          textElement.fontSize = Math.max(8, Math.round(textElement.fontSize * scaleY));
        }
      }
    },

    groupElements: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload;
      if (ids.length < 2) return;

      // Get elements to group
      const elementsToGroup = state.elements.filter((el) => ids.includes(el.id));
      if (elementsToGroup.length < 2) return;

      // Calculate bounding box for the group
      const minX = Math.min(...elementsToGroup.map((el) => el.position.x));
      const minY = Math.min(...elementsToGroup.map((el) => el.position.y));
      const maxX = Math.max(...elementsToGroup.map((el) => el.position.x + el.size.width));
      const maxY = Math.max(...elementsToGroup.map((el) => el.position.y + el.size.height));

      const groupElement: CanvasElement = {
        id: `group-${Date.now()}`,
        type: 'group',
        position: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
        children: ids,
      };

      state.elements.push(groupElement);
      state.selectedIds = [groupElement.id];
    },

    ungroupElement: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const groupIndex = state.elements.findIndex((el) => el.id === id);
      if (groupIndex === -1) return;

      const group = state.elements[groupIndex];
      if (group.type !== 'group') return;

      // Remove the group
      const children = [...group.children];
      state.elements.splice(groupIndex, 1);

      // Select the children
      state.selectedIds = children;
    },

    updateTextContent: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const { id, content } = action.payload;
      const elementIndex = state.elements.findIndex((el) => el.id === id);
      if (elementIndex !== -1 && state.elements[elementIndex].type === 'text') {
        (state.elements[elementIndex] as TextElement).content = content;
      }
    },

    updateTableCell: (state, action: PayloadAction<{ id: string; row: number; col: number; content: string }>) => {
      const { id, row, col, content } = action.payload;
      const elementIndex = state.elements.findIndex((el) => el.id === id);
      if (elementIndex !== -1 && state.elements[elementIndex].type === 'table') {
        const tableElement = state.elements[elementIndex] as TableElement;
        if (tableElement.cells[row] && tableElement.cells[row][col]) {
          tableElement.cells[row][col].content = content;
        }
      }
    },

    addTextElement: (state) => {
      const newElement: TextElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 50 },
        content: 'Double-click to edit',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
      };
      state.elements.push(newElement);
      state.selectedIds = [newElement.id];
    },

    addTableElement: (state) => {
      const rows = 3;
      const columns = 3;
      const cells: TableCell[][] = Array(rows)
        .fill(null)
        .map((_, rowIdx) =>
          Array(columns)
            .fill(null)
            .map((_, colIdx) => ({ content: `R${rowIdx + 1}C${colIdx + 1}` }))
        );

      const newElement: TableElement = {
        id: `table-${Date.now()}`,
        type: 'table',
        position: { x: 150, y: 150 },
        size: { width: 300, height: 200 },
        rows,
        columns,
        cells,
        borderColor: '#000000',
        borderWidth: 1,
        cellPadding: 8,
      };
      state.elements.push(newElement);
      state.selectedIds = [newElement.id];
    },

    deleteSelected: (state) => {
      state.selectedIds.forEach((id) => {
        state.elements = state.elements.filter((el) => el.id !== id);
      });
      state.selectedIds = [];
    },
  },
});

export const {
  addElement,
  updateElement,
  deleteElement,
  selectElement,
  clearSelection,
  setZoom,
  setPan,
  moveElement,
  resizeElement,
  groupElements,
  ungroupElement,
  updateTextContent,
  updateTableCell,
  addTextElement,
  addTableElement,
  deleteSelected,
} = canvasSlice.actions;

export default canvasSlice.reducer;
