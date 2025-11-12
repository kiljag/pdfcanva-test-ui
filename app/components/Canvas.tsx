'use client';

import React, { useRef, useEffect } from 'react';
import { useCanvas } from '../context/CanvasContext';
import CanvasElement from './CanvasElement';

export default function Canvas() {
  const { state, dispatch } = useCanvas();
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected elements on Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        state.selectedIds.forEach((id) => {
          dispatch({ type: 'DELETE_ELEMENT', id });
        });
      }

      // Clear selection on Escape
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedIds, dispatch]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Clear selection if clicking on canvas background
    if (e.target === e.currentTarget) {
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  };

  // Get all elements that should be rendered (excluding children of groups as they're rendered within groups)
  const topLevelElements = state.elements.filter((element) => {
    // Check if this element is a child of any group
    const isChildOfGroup = state.elements.some(
      (el) => el.type === 'group' && el.children.includes(element.id)
    );
    return !isChildOfGroup;
  });

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gray-100"
      onClick={handleCanvasClick}
      style={{
        cursor: 'default',
      }}
    >
      {/* Canvas content with zoom and pan */}
      <div
        style={{
          transform: `scale(${state.zoom}) translate(${state.pan.x}px, ${state.pan.y}px)`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Render all top-level elements */}
        {topLevelElements.map((element) => (
          <CanvasElement key={element.id} element={element} />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 0.1 })}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <div className="text-center text-sm font-medium">
          {Math.round(state.zoom * 100)}%
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 0.1 })}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: 1 })}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

      {/* Selection info */}
      {state.selectedIds.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 text-sm">
          {state.selectedIds.length} element(s) selected
        </div>
      )}
    </div>
  );
}
