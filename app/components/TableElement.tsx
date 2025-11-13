'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateTableCell } from '../store/canvasSlice';
import type { TableElement as TableElementType } from '../types/canvas';

interface Props {
  element: TableElementType;
}

function TableElement({ element }: Props) {
  const dispatch = useAppDispatch();
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellDoubleClick = (row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ row, col });
    setEditValue(element.cells[row][col].content);
  };

  const handleBlur = () => {
    if (editingCell) {
      dispatch(updateTableCell({
        id: element.id,
        row: editingCell.row,
        col: editingCell.col,
        content: editValue,
      }));
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const cellWidth = element.size.width / element.columns;
  const cellHeight = element.size.height / element.rows;

  return (
    <div
      className="w-full h-full bg-white shadow-sm"
      style={{
        border: `${element.borderWidth}px solid ${element.borderColor}`,
      }}
    >
      <table className="w-full h-full border-collapse">
        <tbody>
          {element.cells.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  className="relative overflow-hidden"
                  style={{
                    border: `${element.borderWidth}px solid ${element.borderColor}`,
                    padding: element.cellPadding,
                    width: cellWidth,
                    height: cellHeight,
                  }}
                  onDoubleClick={(e) => handleCellDoubleClick(rowIdx, colIdx, e)}
                >
                  {editingCell?.row === rowIdx && editingCell?.col === colIdx ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="w-full h-full border-none outline-none bg-blue-50"
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="w-full h-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {cell.content}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TableElement);
