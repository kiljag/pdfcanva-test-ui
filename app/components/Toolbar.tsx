'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectToolbarState, selectSelectedIds } from '../store/selectors';
import { addTextElement, addTableElement, groupElements, ungroupElement, deleteSelected } from '../store/canvasSlice';

export default function Toolbar() {
  const dispatch = useAppDispatch();
  const { canGroup, canUngroup, hasSelection } = useAppSelector(selectToolbarState);
  const selectedIds = useAppSelector(selectSelectedIds);

  const handleGroup = () => {
    if (canGroup) {
      dispatch(groupElements(selectedIds));
    }
  };

  const handleUngroup = () => {
    if (canUngroup && selectedIds.length === 1) {
      dispatch(ungroupElement(selectedIds[0]));
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Add Elements Section */}
      <div className="flex gap-2 pr-4 border-r border-gray-300">
        <button
          onClick={() => dispatch(addTextElement())}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          title="Add Text Element (Double-click to edit)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Add Text
        </button>
        <button
          onClick={() => dispatch(addTableElement())}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          title="Add Table Element (Double-click cells to edit)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Add Table
        </button>
      </div>

      {/* Group/Ungroup Section */}
      <div className="flex gap-2 pr-4 border-r border-gray-300">
        <button
          onClick={handleGroup}
          disabled={!canGroup}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
            canGroup
              ? 'bg-purple-500 text-white hover:bg-purple-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={canGroup ? 'Group selected elements (Select 2+ elements)' : 'Select 2 or more elements to group'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Group
        </button>
        <button
          onClick={handleUngroup}
          disabled={!canUngroup}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
            canUngroup
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={canUngroup ? 'Ungroup selected group' : 'Select a group to ungroup'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Ungroup
        </button>
      </div>

      {/* Delete Section */}
      <div className="flex gap-2">
        <button
          onClick={() => dispatch(deleteSelected())}
          disabled={!hasSelection}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
            hasSelection
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Delete selected elements (or press Delete key)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>

      {/* Info Section */}
      <div className="ml-auto text-sm text-gray-600">
        <div className="flex flex-col gap-1">
          <div>💡 <strong>Tip:</strong> Hold Ctrl/Cmd to multi-select</div>
          <div>⌨️ <strong>Shortcuts:</strong> Delete key to remove, Escape to clear selection</div>
        </div>
      </div>
    </div>
  );
}
