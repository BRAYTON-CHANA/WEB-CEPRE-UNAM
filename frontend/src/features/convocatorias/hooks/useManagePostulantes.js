import { useState, useMemo, useCallback, useEffect } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { createPostulacion, loadAdjuntosPostulacion, updateAdjuntosPostulacion } from '@/features/plazas_docentes/services/postulacionesService';
import {
  getPlazasDisponibles,
  asignarPlazaPostulacion,
  liberarPlazaPostulacion
} from '@/features/convocatorias/services/convocatoriasService';

/**
 * useManagePostulantes — lógica del panel de postulantes.
 * Solo recarga la tabla cuando cambia idConvocatoria (obligatorio).
 * Sede, curso y búsqueda se filtran client-side sobre los datos ya cargados.
 * @param {Array} convocatoriaCursos - lista de VW_CONVOCATORIAS_CURSO disponibles para postular
 * @param {string} searchTerm - texto de búsqueda (DNI, nombre, RUC)
 */
export function useManagePostulantes({ idConvocatoriaCurso, idConvocatoria, idSede, convocatoriaCursos = [], convocatoriaLabel = '', searchTerm = '' }) {

  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingPostulacion, setEditingPostulacion] = useState(null);
  const [editingAdjuntos, setEditingAdjuntos] = useState(null);
  const [loadingAdjuntos, setLoadingAdjuntos] = useState(false);

  const [asignarModal, setAsignarModal] = useState({ open: false, postulacion: null, plazas: [], loadingPlazas: false, selectedPlaza: null, asignando: false });

  // Modal ver/editar adjuntos
  const [adjuntosModal, setAdjuntosModal] = useState({ open: false, postulacion: null, adjuntos: null, loading: false, saving: false });

  const load = useCallback(async () => {
    // Solo filtrar por convocatoria a nivel BD — sede/curso/search se filtran client-side
    if (!idConvocatoria) {
      setPostulaciones([]);
      return;
    }
    const filters = { ID_CONVOCATORIA: idConvocatoria };

    setLoading(true);
    setError(null);
    try {
      const data = await db.select('VW_POSTULACIONES_PLAZA', filters);
      setPostulaciones(data || []);
    } catch (err) {
      setError(err);
      console.error('Error cargando postulaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [idConvocatoria]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    cacheService.invalidateAll();
    load();
  }, [load]);

  // Filtrado client-side: sede, curso y búsqueda (DNI/nombre/RUC)
  const filteredPostulaciones = useMemo(() => {
    let result = postulaciones;

    if (idSede) {
      result = result.filter(p => String(p.ID_SEDE) === String(idSede));
    }
    if (idConvocatoriaCurso) {
      result = result.filter(p => String(p.ID_CONVOCATORIA_CURSO) === String(idConvocatoriaCurso));
    }
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(p => {
        const dni = String(p.DNI || '').toLowerCase();
        const nombre = String(p.DOCENTE_NOMBRE || '').toLowerCase();
        const ruc = String(p.RUC || '').toLowerCase();
        return dni.includes(term) || nombre.includes(term) || ruc.includes(term);
      });
    }
    return result;
  }, [postulaciones, idSede, idConvocatoriaCurso, searchTerm]);

  const initialValues = useMemo(() => ({
    ID_CONVOCATORIA: convocatoriaLabel,
    ID_CONVOCATORIA_CURSO: idConvocatoriaCurso || '',
    ESTADO: 'postulado',
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
  }), [idConvocatoriaCurso, convocatoriaLabel]);

  const handleSubmit = async (submitData, rawFormData) => {
    setCreating(true);
    setFormError(null);
    try {
      if (editingPostulacion) {
        const { ID_POSTULACION, ...restData } = submitData;
        const updateData = { ...restData };
        delete updateData.ID_PLAZA_DOCENTE;
        delete updateData.ID_CONVOCATORIA_CURSO;
        await db.update('POSTULACION_PLAZA', editingPostulacion.ID_POSTULACION, updateData, 'ID_POSTULACION');
        await updateAdjuntosPostulacion(editingPostulacion.ID_POSTULACION, rawFormData);
      } else {
        await createPostulacion(submitData, rawFormData);
      }
      setIsModalOpen(false);
      setEditingPostulacion(null);
      setEditingAdjuntos(null);
      refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditPostulacion = async (postulacion) => {
    setEditingPostulacion(postulacion);
    setEditingAdjuntos(null);
    setLoadingAdjuntos(true);
    setIsModalOpen(true);
    try {
      const adjuntos = await loadAdjuntosPostulacion(
        postulacion.ID_POSTULACION,
        postulacion.CONDICION_LABORAL_SNAPSHOT
      );
      setEditingAdjuntos(adjuntos);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoadingAdjuntos(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPostulacion(null);
    setEditingAdjuntos(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPostulacion(null);
    setEditingAdjuntos(null);
    setFormError(null);
  };

  const handleConfirmarAsignacion = async () => {
    const { postulacion, selectedPlaza } = asignarModal;
    if (!postulacion || !selectedPlaza) return;
    setAsignarModal(prev => ({ ...prev, asignando: true }));
    try {
      await asignarPlazaPostulacion(postulacion.ID_POSTULACION, selectedPlaza);
      setAsignarModal({ open: false, postulacion: null, plazas: [], loadingPlazas: false, selectedPlaza: null, asignando: false });
      refresh();
    } catch (err) {
      setFormError(err.message);
      setAsignarModal(prev => ({ ...prev, asignando: false }));
    }
  };

  const handleLiberarPlaza = async (postulacion) => {
    if (!postulacion?.ACEPTADO) return;
    if (!window.confirm('¿Liberar la plaza asignada? La postulación será descartada y la plaza quedará disponible.')) return;
    try {
      await liberarPlazaPostulacion(postulacion.ID_POSTULACION);
      refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSaveSuccess = async (recordId, field, newValue, primaryKey) => {
    if (field === 'ACEPTADO' && newValue === true) {
      const postulacion = postulaciones.find(p => String(p.ID_POSTULACION) === String(recordId));
      if (postulacion) {
        setAsignarModal({ open: true, postulacion, plazas: [], loadingPlazas: true, selectedPlaza: null, asignando: false });
        try {
          const plazas = await getPlazasDisponibles(idConvocatoriaCurso);
          setAsignarModal(prev => ({ ...prev, plazas: plazas || [], loadingPlazas: false }));
        } catch (err) {
          setAsignarModal(prev => ({ ...prev, loadingPlazas: false, plazas: [] }));
          setFormError(err.message);
        }
        refresh();
        return;
      }
    }
    if (field === 'ACEPTADO' && newValue === false) {
      const postulacion = postulaciones.find(p => String(p.ID_POSTULACION) === String(recordId));
      if (postulacion?.ACEPTADO) {
        await handleLiberarPlaza(postulacion);
        return;
      }
    }
    refresh();
  };

  const handleSaveError = (recordId, field, error) => {
    setFormError(error?.message || 'Error al guardar');
  };

  const closeAsignarModal = () => {
    setAsignarModal({ open: false, postulacion: null, plazas: [], loadingPlazas: false, selectedPlaza: null, asignando: false });
  };

  // ===== Eliminar postulación =====
  const handleDeletePostulacion = async (postulacion) => {
    if (!postulacion?.ID_POSTULACION) return;
    if (!window.confirm(`¿Eliminar la postulación de ${postulacion.DOCENTE_NOMBRE}? Se borrarán también todos sus documentos.`)) return;
    try {
      await db.delete('POSTULACION_PLAZA', postulacion.ID_POSTULACION, 'ID_POSTULACION');
      refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // ===== Ver/editar adjuntos =====
  const handleViewAdjuntos = async (postulacion) => {
    setAdjuntosModal({ open: true, postulacion, adjuntos: null, loading: true, saving: false });
    try {
      const adjuntos = await loadAdjuntosPostulacion(
        postulacion.ID_POSTULACION,
        postulacion.CONDICION_LABORAL_SNAPSHOT
      );
      setAdjuntosModal(prev => ({ ...prev, adjuntos, loading: false }));
    } catch (err) {
      setFormError(err.message);
      setAdjuntosModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSaveAdjuntos = async (adjuntosData) => {
    const idPostulacion = adjuntosModal.postulacion?.ID_POSTULACION;
    if (!idPostulacion) return;
    setAdjuntosModal(prev => ({ ...prev, saving: true }));
    try {
      await updateAdjuntosPostulacion(idPostulacion, { ADJUNTOS_DATA: adjuntosData });
      setAdjuntosModal(prev => ({ ...prev, saving: false }));
      // Recargar adjuntos para reflejar cambios
      const adjuntos = await loadAdjuntosPostulacion(
        idPostulacion,
        adjuntosModal.postulacion.CONDICION_LABORAL_SNAPSHOT
      );
      setAdjuntosModal(prev => ({ ...prev, adjuntos, saving: false }));
    } catch (err) {
      setFormError(err.message);
      setAdjuntosModal(prev => ({ ...prev, saving: false }));
    }
  };

  const closeAdjuntosModal = () => {
    setAdjuntosModal({ open: false, postulacion: null, adjuntos: null, loading: false, saving: false });
  };

  return {
    // Data
    postulaciones: filteredPostulaciones, loading, error,
    // Modal crear/editar
    isModalOpen, creating, formError,
    editingPostulacion, editingAdjuntos, loadingAdjuntos,
    initialValues,
    handleOpenCreate, handleEditPostulacion, handleCloseModal, handleSubmit,
    // Asignar plaza
    asignarModal, setAsignarModal, handleConfirmarAsignacion, closeAsignarModal,
    // Tabla editable
    handleSaveSuccess, handleSaveError,
    // Eliminar
    handleDeletePostulacion,
    // Ver/editar adjuntos
    adjuntosModal, handleViewAdjuntos, handleSaveAdjuntos, closeAdjuntosModal,
  };
}
