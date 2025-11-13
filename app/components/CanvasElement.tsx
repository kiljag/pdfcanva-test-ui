'use client';

import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectIsElementSelected, selectGroupChildren, selectZoom, selectElements } from '../store/selectors';
import { selectElement, moveElement, resizeElement } from '../store/canvasSlice';
import type { CanvasElement as CanvasElementType, ResizeHandle } from '../types/canvas';
import TextElement from './TextElement';
import TableElement from './TableElement';

interface Props {
  element: CanvasElementType;
}

function CanvasElement({ element }: Props) {
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector((state) => selectIsElementSelected(element.id)(state));
  const zoom = useAppSelector(selectZoom);
  const groupChildren = useAppSelector((state) =>
    element.type === 'group' ? selectGroupChildren(element.id)(state) : []
  );

  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const dragStart = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const resizeStart = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    elementX: 0,
    elementY: 0
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return; // Let resize handle do its job
    }

    e.stopPropagation();

    // Multi-select with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      dispatch(selectElement({ id: element.id, multiSelect: true }));
    } else if (!isSelected) {
      dispatch(selectElement({ id: element.id }));
    }

    // Start dragging
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: element.position.x,
      elementY: element.position.y,
    };
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);

    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
      elementX: element.position.x,
      elementY: element.position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - dragStart.current.x) / zoom;
        const deltaY = (e.clientY - dragStart.current.y) / zoom;

        const newPosition = {
          x: dragStart.current.elementX + deltaX,
          y: dragStart.current.elementY + deltaY,
        };

        dispatch(moveElement({ id: element.id, position: newPosition }));
      } else if (isResizing && resizeHandle) {
        const deltaX = (e.clientX - resizeStart.current.x) / zoom;
        const deltaY = (e.clientY - resizeStart.current.y) / zoom;

        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.elementX;
        let newY = resizeStart.current.elementY;

        // Handle different resize directions
        switch (resizeHandle) {
          case 'se': // Southeast (bottom-right)
            newWidth = Math.max(50, resizeStart.current.width + deltaX);
            newHeight = Math.max(30, resizeStart.current.height + deltaY);
            break;
          case 'sw': // Southwest (bottom-left)
            newWidth = Math.max(50, resizeStart.current.width - deltaX);
            newHeight = Math.max(30, resizeStart.current.height + deltaY);
            newX = resizeStart.current.elementX + (resizeStart.current.width - newWidth);
            break;
          case 'ne': // Northeast (top-right)
            newWidth = Math.max(50, resizeStart.current.width + deltaX);
            newHeight = Math.max(30, resizeStart.current.height - deltaY);
            newY = resizeStart.current.elementY + (resizeStart.current.height - newHeight);
            break;
          case 'nw': // Northwest (top-left)
            newWidth = Math.max(50, resizeStart.current.width - deltaX);
            newHeight = Math.max(30, resizeStart.current.height - deltaY);
            newX = resizeStart.current.elementX + (resizeStart.current.width - newWidth);
            newY = resizeStart.current.elementY + (resizeStart.current.height - newHeight);
            break;
        }

        // Update position if needed (for nw, ne, sw handles)
        if (newX !== resizeStart.current.elementX || newY !== resizeStart.current.elementY) {
          dispatch(moveElement({ id: element.id, position: { x: newX, y: newY } }));
        }

        dispatch(resizeElement({ id: element.id, size: { width: newWidth, height: newHeight } }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, resizeHandle, element.id, zoom, dispatch, element.position.x, element.position.y]);

  const renderContent = useMemo(() => {
    if (element.type === 'text') {
      return <TextElement element={element} />;
    } else if (element.type === 'table') {
      return <TableElement element={element} />;
    } else if (element.type === 'group') {
      // Render group children
      return (
        <div className="w-full h-full relative">
          {groupChildren.map((child) => (
            <div
              key={child.id}
              style={{
                position: 'absolute',
                left: child.position.x - element.position.x,
                top: child.position.y - element.position.y,
                width: child.size.width,
                height: child.size.height,
                pointerEvents: 'none', // Prevent interaction with children when in a group
              }}
            >
              {child.type === 'text' && <TextElement element={child} />}
              {child.type === 'table' && <TableElement element={child} />}
            </div>
          ))}
          <div className="absolute inset-0 border-2 border-dashed border-purple-400 pointer-events-none">
            <div className="absolute top-0 left-0 bg-purple-500 text-white text-xs px-2 py-1 -translate-y-full">
              Group ({element.children.length} items)
            </div>
          </div>
        </div>
      );
    }
    return null;
  }, [element, groupChildren]);

  return (
    <div
      ref={elementRef}
      className={`absolute ${isDragging ? 'cursor-move' : 'cursor-pointer'}`}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        zIndex: isSelected ? 1000 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Selection border */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
      )}

      {/* Content */}
      <div className="w-full h-full">
        {renderContent}
      </div>

      {/* Resize handles (only show for selected elements) */}
      {isSelected && (
        <>
          {/* Corner handles for diagonal resizing */}
          <div
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize"
            style={{ left: -6, top: -6 }}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize"
            style={{ right: -6, top: -6 }}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize"
            style={{ left: -6, bottom: -6 }}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize"
            style={{ right: -6, bottom: -6 }}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
        </>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(CanvasElement, (prevProps, nextProps) => {
  // Only re-render if the element reference changed
  return prevProps.element === nextProps.element;
});
