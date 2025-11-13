'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { CanvasState, CanvasElement, Position, Size } from '../types/canvas';

type CanvasAction =
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<CanvasElement> }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'SELECT_ELEMENT'; id: string; multiSelect?: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; pan: Position }
  | { type: 'MOVE_ELEMENT'; id: string; position: Position }
  | { type: 'RESIZE_ELEMENT'; id: string; size: Size }
  | { type: 'GROUP_ELEMENTS'; ids: string[] }
  | { type: 'UNGROUP_ELEMENT'; id: string }
  | { type: 'UPDATE_TEXT_CONTENT'; id: string; content: string }
  | { type: 'UPDATE_TABLE_CELL'; id: string; row: number; col: number; content: string };

interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  addTextElement: () => void;
  addTableElement: () => void;
  groupSelectedElements: () => void;
  ungroupElement: (id: string) => void;
  deleteSelected: () => void;
}

const initialState: CanvasState = {
  elements: [],
  selectedIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
};

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_ELEMENT':
      return {
        ...state,
        elements: [...state.elements, action.element],
        selectedIds: [action.element.id],
      };

    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, ...action.updates } as CanvasElement : el
        ),
      };

    case 'DELETE_ELEMENT': {
      const elementToDelete = state.elements.find((el) => el.id === action.id);
      let elementsToRemove = [action.id];

      // If deleting a group, also remove child references but keep the children
      if (elementToDelete?.type === 'group') {
        // Just remove the group, children remain as independent elements
      }

      return {
        ...state,
        elements: state.elements.filter((el) => !elementsToRemove.includes(el.id)),
        selectedIds: state.selectedIds.filter((id) => id !== action.id),
      };
    }

    case 'SELECT_ELEMENT':
      if (action.multiSelect) {
        const isSelected = state.selectedIds.includes(action.id);
        return {
          ...state,
          selectedIds: isSelected
            ? state.selectedIds.filter((id) => id !== action.id)
            : [...state.selectedIds, action.id],
        };
      }
      return {
        ...state,
        selectedIds: [action.id],
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedIds: [],
      };

    case 'SET_ZOOM':
      return {
        ...state,
        zoom: Math.max(0.1, Math.min(5, action.zoom)),
      };

    case 'SET_PAN':
      return {
        ...state,
        pan: action.pan,
      };

    case 'MOVE_ELEMENT': {
      const element = state.elements.find((el) => el.id === action.id);
      if (!element) return state;

      // If it's a group, move all children relative to the group movement
      if (element.type === 'group') {
        const deltaX = action.position.x - element.position.x;
        const deltaY = action.position.y - element.position.y;

        return {
          ...state,
          elements: state.elements.map((el) => {
            if (el.id === action.id) {
              return { ...el, position: action.position };
            }
            if (element.children.includes(el.id)) {
              return {
                ...el,
                position: {
                  x: el.position.x + deltaX,
                  y: el.position.y + deltaY,
                },
              };
            }
            return el;
          }),
        };
      }

      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, position: action.position } : el
        ),
      };
    }

    case 'RESIZE_ELEMENT': {
      const element = state.elements.find((el) => el.id === action.id);
      if (!element) return state;

      // If it's a group, resize all children proportionally
      if (element.type === 'group') {
        const scaleX = action.size.width / element.size.width;
        const scaleY = action.size.height / element.size.height;

        return {
          ...state,
          elements: state.elements.map((el) => {
            if (el.id === action.id) {
              return { ...el, size: action.size };
            }
            if (element.children.includes(el.id)) {
              const relativeX = el.position.x - element.position.x;
              const relativeY = el.position.y - element.position.y;

              return {
                ...el,
                position: {
                  x: element.position.x + relativeX * scaleX,
                  y: element.position.y + relativeY * scaleY,
                },
                size: {
                  width: el.size.width * scaleX,
                  height: el.size.height * scaleY,
                },
              };
            }
            return el;
          }),
        };
      }

      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, size: action.size } : el
        ),
      };
    }

    case 'GROUP_ELEMENTS': {
      if (action.ids.length < 2) return state;

      // Calculate bounding box for the group
      const elementsToGroup = state.elements.filter((el) =>
        action.ids.includes(el.id)
      );

      const minX = Math.min(...elementsToGroup.map((el) => el.position.x));
      const minY = Math.min(...elementsToGroup.map((el) => el.position.y));
      const maxX = Math.max(
        ...elementsToGroup.map((el) => el.position.x + el.size.width)
      );
      const maxY = Math.max(
        ...elementsToGroup.map((el) => el.position.y + el.size.height)
      );

      const groupElement: CanvasElement = {
        id: `group-${Date.now()}`,
        type: 'group',
        position: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
        children: action.ids,
      };

      return {
        ...state,
        elements: [...state.elements, groupElement],
        selectedIds: [groupElement.id],
      };
    }

    case 'UNGROUP_ELEMENT': {
      const group = state.elements.find((el) => el.id === action.id);
      if (!group || group.type !== 'group') return state;

      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.id),
        selectedIds: group.children,
      };
    }

    case 'UPDATE_TEXT_CONTENT': {
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id && el.type === 'text'
            ? { ...el, content: action.content }
            : el
        ),
      };
    }

    case 'UPDATE_TABLE_CELL': {
      return {
        ...state,
        elements: state.elements.map((el) => {
          if (el.id === action.id && el.type === 'table') {
            const newCells = el.cells.map((row, rowIdx) =>
              row.map((cell, colIdx) =>
                rowIdx === action.row && colIdx === action.col
                  ? { content: action.content }
                  : cell
              )
            );
            return { ...el, cells: newCells };
          }
          return el;
        }),
      };
    }

    default:
      return state;
  }
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  const addTextElement = () => {
    const newElement: CanvasElement = {
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
    dispatch({ type: 'ADD_ELEMENT', element: newElement });
  };

  const addTableElement = () => {
    const rows = 3;
    const columns = 3;
    const cells: { content: string }[][] = Array(rows)
      .fill(null)
      .map((_, rowIdx) =>
        Array(columns)
          .fill(null)
          .map((_, colIdx) => ({ content: `R${rowIdx + 1}C${colIdx + 1}` }))
      );

    const newElement: CanvasElement = {
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
    dispatch({ type: 'ADD_ELEMENT', element: newElement });
  };

  const groupSelectedElements = () => {
    if (state.selectedIds.length >= 2) {
      dispatch({ type: 'GROUP_ELEMENTS', ids: state.selectedIds });
    }
  };

  const ungroupElement = (id: string) => {
    dispatch({ type: 'UNGROUP_ELEMENT', id });
  };

  const deleteSelected = () => {
    state.selectedIds.forEach((id) => {
      dispatch({ type: 'DELETE_ELEMENT', id });
    });
  };

  return (
    <CanvasContext.Provider
      value={{
        state,
        dispatch,
        addTextElement,
        addTableElement,
        groupSelectedElements,
        ungroupElement,
        deleteSelected,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider');
  }
  return context;
}
