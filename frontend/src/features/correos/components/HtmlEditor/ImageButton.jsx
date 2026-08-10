import React, { useRef } from 'react';
import { ImageIcon } from '@/features/correos/components/CorreoIcons';

const ImageButton = ({ onInsert, disabled, title = 'Insertar imagen' }) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    if (!files?.length) return;

    const fileList = [...files];
    const readers = fileList.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then(dataUrls => {
      dataUrls.forEach(dataUrl => onInsert(dataUrl));
    });

    // Permite volver a seleccionar el mismo archivo.
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClick}
        disabled={disabled}
        title={title}
        className="p-1.5 hover:bg-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </>
  );
};

export default ImageButton;
