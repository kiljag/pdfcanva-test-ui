import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';
import type { CanvasElement } from '../types/canvas';

// Base selectors
export const selectCanvasState = (state: RootState) => state.canvas;
export const selectElements = (state: RootState) => state.canvas.elements;
export const selectSelectedIds = (state: RootState) => state.canvas.selectedIds;
export const selectZoom = (state: RootState) => state.canvas.zoom;
export const selectPan = (state: RootState) => state.canvas.pan;

// Memoized selector for top-level elements (not children of groups)
export const selectTopLevelElements = createSelector(
  [selectElements],
  (elements) => {
    return elements.filter((element) => {
      // Check if this element is a child of any group
      const isChildOfGroup = elements.some(
        (el) => el.type === 'group' && el.children.includes(element.id)
      );
      return !isChildOfGroup;
    });
  }
);

// Memoized selector for a specific element by ID
export const selectElementById = (id: string) =>
  createSelector(
    [selectElements],
    (elements) => elements.find((el) => el.id === id)
  );

// Memoized selector for checking if an element is selected
export const selectIsElementSelected = (id: string) =>
  createSelector(
    [selectSelectedIds],
    (selectedIds) => selectedIds.includes(id)
  );

// Memoized selector for group children
export const selectGroupChildren = (groupId: string) =>
  createSelector(
    [selectElements],
    (elements) => {
      const group = elements.find((el) => el.id === groupId);
      if (!group || group.type !== 'group') return [];
      return elements.filter((el) => group.children.includes(el.id));
    }
  );

// Memoized selector for toolbar state
export const selectToolbarState = createSelector(
  [selectSelectedIds, selectElements],
  (selectedIds, elements) => {
    const canGroup = selectedIds.length >= 2;
    const canUngroup =
      selectedIds.length === 1 &&
      elements.find((el) => el.id === selectedIds[0])?.type === 'group';
    const hasSelection = selectedIds.length > 0;

    return {
      canGroup,
      canUngroup,
      hasSelection,
      selectedCount: selectedIds.length,
    };
  }
);
