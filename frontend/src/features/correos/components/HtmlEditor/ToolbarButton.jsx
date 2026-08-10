import React from 'react';

const ToolbarButton = ({ onClick, disabled, label, icon }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={label}
    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {icon}
  </button>
);

export default ToolbarButton;
