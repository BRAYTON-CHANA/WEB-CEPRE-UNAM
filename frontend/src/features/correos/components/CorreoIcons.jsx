import React from 'react';

const IconBase = ({ className = 'w-4 h-4', strokeWidth = 2, children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const BoldIcon = (props) => (
  <IconBase {...props}>
    <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
    <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
  </IconBase>
);

export const ItalicIcon = (props) => (
  <IconBase {...props}>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </IconBase>
);

export const UnderlineIcon = (props) => (
  <IconBase {...props}>
    <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </IconBase>
);

export const AlignLeftIcon = (props) => (
  <IconBase {...props}>
    <line x1="17" y1="10" x2="3" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="17" y1="18" x2="3" y2="18" />
  </IconBase>
);

export const AlignCenterIcon = (props) => (
  <IconBase {...props}>
    <line x1="18" y1="10" x2="6" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="18" y1="18" x2="6" y2="18" />
  </IconBase>
);

export const AlignRightIcon = (props) => (
  <IconBase {...props}>
    <line x1="21" y1="10" x2="7" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="21" y1="18" x2="7" y2="18" />
  </IconBase>
);

export const ListBulletIcon = (props) => (
  <IconBase {...props}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </IconBase>
);

export const ListNumberIcon = (props) => (
  <IconBase {...props}>
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v8" />
    <path d="M4 18h.01" />
  </IconBase>
);

export const MarkerIcon = (props) => (
  <IconBase {...props}>
    <path
      d="M8 17l8-8 4 4-8 8H8v-4z"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M8 17l8-8 4 4-8 8H8v-4z" />
  </IconBase>
);

export const ChevronDownIcon = (props) => (
  <IconBase {...props}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);

export const RemoveHighlightIcon = (props) => (
  <IconBase {...props}>
    <path d="M3 3l18 18" />
    <path d="M8 17l8-8 4 4-8 8H8v-4z" />
  </IconBase>
);

export const ImageIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </IconBase>
);

export const TableIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="1" ry="1" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </IconBase>
);

export const RowAboveIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="10" width="18" height="8" rx="1" />
    <line x1="12" y1="3" x2="12" y2="8" />
    <polyline points="9 5 12 2 15 5" />
  </IconBase>
);

export const RowBelowIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="6" width="18" height="8" rx="1" />
    <line x1="12" y1="16" x2="12" y2="21" />
    <polyline points="9 19 12 22 15 19" />
  </IconBase>
);

export const ColLeftIcon = (props) => (
  <IconBase {...props}>
    <rect x="10" y="3" width="8" height="18" rx="1" />
    <line x1="3" y1="12" x2="8" y2="12" />
    <polyline points="5 9 2 12 5 15" />
  </IconBase>
);

export const ColRightIcon = (props) => (
  <IconBase {...props}>
    <rect x="6" y="3" width="8" height="18" rx="1" />
    <line x1="16" y1="12" x2="21" y2="12" />
    <polyline points="19 9 22 12 19 15" />
  </IconBase>
);

export const DeleteRowIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="8" width="18" height="8" rx="1" />
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" />
  </IconBase>
);

export const DeleteColIcon = (props) => (
  <IconBase {...props}>
    <rect x="8" y="3" width="8" height="18" rx="1" />
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" />
  </IconBase>
);

export const MergeCellsIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="12" y1="3" x2="12" y2="12" />
  </IconBase>
);

export const SplitCellIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </IconBase>
);

export const DeleteTableIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" />
  </IconBase>
);

export const PaintBucketIcon = (props) => (
  <IconBase {...props}>
    <path d="M19 11l-7-7-7 7 7 7 7-7z" />
    <path d="M5 11h14" />
    <path d="M19 15v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1" />
  </IconBase>
);

export const PaletteIcon = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="9" r="3" fill="currentColor" fillOpacity="0.3" />
    <circle cx="7" cy="15" r="3" fill="currentColor" fillOpacity="0.3" />
    <circle cx="17" cy="15" r="3" fill="currentColor" fillOpacity="0.3" />
  </IconBase>
);

export const FontColorIcon = ({ color = 'currentColor', ...props }) => (
  <IconBase {...props}>
    <path d="M9 3h6l5 14h-5l-1-3H10l-1 3H4L9 3z" />
    <path d="M4 21h16" stroke={color} strokeWidth={3} />
  </IconBase>
);

export const PaperclipIcon = (props) => (
  <IconBase {...props}>
    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.65l-6.424 6.59a6 6 0 108.49 8.49l6.408-6.59" />
  </IconBase>
);

export const FileImageIcon = (props) => (
  <IconBase {...props} strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <circle cx="9" cy="13" r="1.5" />
    <path d="M6 18l3-3 3 3 2-2 4 4" />
  </IconBase>
);

export const FilePdfIcon = (props) => (
  <IconBase {...props} strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 14h1.5a1.5 1.5 0 010 3H9v-3z" />
    <path d="M9 14v5" />
    <path d="M14 14h1v5h-1z" />
    <path d="M14 14h2" />
  </IconBase>
);

export const FileWordIcon = (props) => (
  <IconBase {...props} strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 14l1.5 5 1.5-4 1.5 4 1.5-5" />
  </IconBase>
);

export const FileExcelIcon = (props) => (
  <IconBase {...props} strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 14l4 5" />
    <path d="M12 14l-4 5" />
  </IconBase>
);

export const FileTextIcon = (props) => (
  <IconBase {...props} strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h8M8 9h2" />
  </IconBase>
);

export const FileGenericIcon = (props) => (
  <IconBase {...props} strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </IconBase>
);

export const MergeFieldIcon = (props) => (
  <IconBase {...props}>
    <path d="M4 4h6v6H4z" />
    <path d="M14 14h6v6h-6z" />
    <path d="M10 7h4a3 3 0 013 3v4" />
  </IconBase>
);

export const DownloadIcon = (props) => (
  <IconBase {...props} strokeWidth={2}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </IconBase>
);
