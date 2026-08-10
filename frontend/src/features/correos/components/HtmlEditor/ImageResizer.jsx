import React, { useEffect, useRef, useState } from 'react';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const CURSOR_CLASS = {
  nw: 'cursor-nw-resize',
  n: 'cursor-n-resize',
  ne: 'cursor-ne-resize',
  e: 'cursor-e-resize',
  se: 'cursor-se-resize',
  s: 'cursor-s-resize',
  sw: 'cursor-sw-resize',
  w: 'cursor-w-resize',
};

const HANDLE_SIZE = 10;
const HANDLE_OFFSET = HANDLE_SIZE / 2;

const getHandleStyle = (dir) => {
  const style = { position: 'absolute', width: `${HANDLE_SIZE}px`, height: `${HANDLE_SIZE}px` };

  if (dir.includes('n')) style.top = `-${HANDLE_OFFSET}px`;
  if (dir.includes('s')) style.bottom = `-${HANDLE_OFFSET}px`;
  if (dir.includes('e')) style.right = `-${HANDLE_OFFSET}px`;
  if (dir.includes('w')) style.left = `-${HANDLE_OFFSET}px`;

  if (dir === 'n' || dir === 's') {
    style.left = '50%';
    style.marginLeft = `-${HANDLE_OFFSET}px`;
  }
  if (dir === 'e' || dir === 'w') {
    style.top = '50%';
    style.marginTop = `-${HANDLE_OFFSET}px`;
  }

  return style;
};

const ImageResizer = ({ target, editorRef, onResizeEnd }) => {
  const [rect, setRect] = useState(null);
  const startRef = useRef(null);

  const updateRect = () => {
    if (!target || !editorRef.current) return;
    const imgRect = target.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    setRect({
      left: imgRect.left - editorRect.left,
      top: imgRect.top - editorRect.top,
      width: imgRect.width,
      height: imgRect.height,
    });
  };

  useEffect(() => {
    updateRect();

    const onScroll = () => updateRect();
    const onResize = () => updateRect();
    const parent = editorRef.current;
    parent?.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    // Los botones de alineación (justifyLeft/Center/Right) modifican el estilo
    // del <div> padre, no el de la imagen. Observamos el editor para cualquier
    // cambio de atributos o estructura y recalculamos la posición del resizer.
    const observer = new MutationObserver(() => updateRect());
    observer.observe(parent, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'align', 'class'],
    });

    return () => {
      parent?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [target, editorRef.current]);

  const handleMouseDown = (dir) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: target.clientWidth,
      height: target.clientHeight,
      dir,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!startRef.current) return;
    const { x, y, width, height, dir } = startRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    let newW = width;
    let newH = height;

    if (dir.includes('e')) newW += dx;
    if (dir.includes('w')) newW -= dx;
    if (dir.includes('s')) newH += dy;
    if (dir.includes('n')) newH -= dy;

    newW = Math.max(20, newW);
    newH = Math.max(20, newH);

    target.style.width = `${newW}px`;
    target.style.height = `${newH}px`;
    // Permitir superar el ancho del editor mientras se arrastra.
    target.style.maxWidth = 'none';

    updateRect();
  };

  const handleMouseUp = () => {
    startRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    onResizeEnd?.();
  };

  if (!rect) return null;

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    >
      {HANDLES.map(dir => (
        <div
          key={dir}
          onMouseDown={handleMouseDown(dir)}
          className={`absolute bg-white border-2 border-blue-600 rounded-full pointer-events-auto shadow ${CURSOR_CLASS[dir]}`}
          style={getHandleStyle(dir)}
        />
      ))}
    </div>
  );
};

export default ImageResizer;
