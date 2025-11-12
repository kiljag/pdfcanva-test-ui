'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../context/CanvasContext';
import type { TextElement as TextElementType } from '../types/canvas';

interface Props {
  element: TextElementType;
}

export default function TextElement({ element }: Props) {
  const { dispatch } = useCanvas();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== element.content) {
      dispatch({ type: 'UPDATE_TEXT_CONTENT', id: element.id, content: editValue });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(element.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="w-full h-full bg-white border border-gray-300 shadow-sm rounded"
      onDoubleClick={handleDoubleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: element.textAlign,
        padding: '8px',
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full border-none outline-none resize-none bg-transparent"
          style={{
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            color: element.color,
            fontWeight: element.fontWeight,
            textAlign: element.textAlign,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="w-full h-full overflow-hidden whitespace-pre-wrap break-words"
          style={{
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            color: element.color,
            fontWeight: element.fontWeight,
            textAlign: element.textAlign,
          }}
        >
          {element.content}
        </div>
      )}
    </div>
  );
}
