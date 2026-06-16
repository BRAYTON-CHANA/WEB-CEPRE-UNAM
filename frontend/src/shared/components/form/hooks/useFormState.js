import { useState, useCallback } from 'react';

/**
 * Hook para manejar el estado del formulario
 * @param {Object} initialValues - Valores iniciales del formulario
 * @returns {Object} - Estado y funciones del formulario
 */
export const useFormState = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues);
  const [touched, setTouched] = useState({});

  /**
   * Actualiza el valor de un campo - solo si el valor realmente cambió
   * @param {string} fieldName - Nombre del campo
   * @param {*} value - Nuevo valor
   */
  const setFieldValue = useCallback((fieldName, value) => {
    setFormData((prev) => {
      // Solo actualizar si el valor realmente cambió
      if (prev[fieldName] === value) return prev;
      return {
        ...prev,
        [fieldName]: value
      };
    });
  }, []);

  /**
   * Marca un campo como touched
   * @param {string} fieldName - Nombre del campo
   */
  const setFieldTouched = useCallback((fieldName) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  /**
   * Marca todos los campos como touched
   * @param {Array} fieldNames - Array de nombres de campos
   */
  const setAllTouched = useCallback((fieldNames) => {
    const allTouched = {};
    fieldNames.forEach((name) => {
      allTouched[name] = true;
    });
    setTouched(allTouched);
  }, []);

  /**
   * Resetea el formulario a los valores iniciales
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setTouched({});
  }, [initialValues]);

  /**
   * Obtiene el valor de un campo
   * @param {string} fieldName - Nombre del campo
   * @returns {*} - Valor del campo
   */
  const getFieldValue = useCallback((fieldName) => {
    return formData[fieldName];
  }, [formData]);

  /**
   * Verifica si un campo fue tocado
   * @param {string} fieldName - Nombre del campo
   * @returns {boolean} - true si fue tocado
   */
  const isFieldTouched = useCallback((fieldName) => {
    return !!touched[fieldName];
  }, [touched]);

  return {
    formData,
    touched,
    setFieldValue,
    setFieldTouched,
    setAllTouched,
    resetForm,
    getFieldValue,
    isFieldTouched,
    setFormData,
    setTouched
  };
};

export default useFormState;
