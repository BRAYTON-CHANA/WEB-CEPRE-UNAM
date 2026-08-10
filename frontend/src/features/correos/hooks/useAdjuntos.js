import { useRef, useState, useCallback } from 'react';

let nextId = 1;

const fileToBase64 = (file, onProgress) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onprogress = (e) => {
    if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
  };
  reader.onload = () => {
    const result = reader.result;
    const base64 = typeof result === 'string' ? result.split(',')[1] : '';
    resolve({ filename: file.name, contentType: file.type, content: base64 });
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export function useAdjuntos() {
  const [adjuntos, setAdjuntos] = useState([]);
  const fileInputRef = useRef(null);

  const updateProgreso = useCallback((id, progress) => {
    setAdjuntos(prev => prev.map(a => (a.id === id ? { ...a, progress } : a)));
  }, []);

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return;
    const fileArr = Array.from(files);

    // Agregar items "loading" inmediatamente.
    const itemsLoading = fileArr.map(file => ({
      id: nextId++,
      filename: file.name,
      contentType: file.type,
      loading: true,
      progress: 0,
    }));
    setAdjuntos(prev => [...prev, ...itemsLoading]);

    // Procesar cada archivo y reemplazar el item loading por el completo.
    await Promise.all(fileArr.map(async (file, i) => {
      const id = itemsLoading[i].id;
      try {
        const result = await fileToBase64(file, (p) => updateProgreso(id, p));
        setAdjuntos(prev => prev.map(a => (
          a.id === id
            ? { id, filename: result.filename, contentType: result.contentType, content: result.content }
            : a
        )));
      } catch (err) {
        // En caso de error, quitar el item.
        setAdjuntos(prev => prev.filter(a => a.id !== id));
      }
    }));
  }, [updateProgreso]);

  const removeAdjunto = useCallback((id) => {
    setAdjuntos(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAdjuntos = useCallback(() => {
    setAdjuntos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const isUploading = useCallback(() => adjuntos.some(a => a.loading), [adjuntos]);

  return { adjuntos, setAdjuntos, fileInputRef, handleFiles, removeAdjunto, clearAdjuntos, isUploading };
}
