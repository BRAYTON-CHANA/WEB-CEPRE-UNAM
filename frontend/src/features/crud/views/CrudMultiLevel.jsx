import React from 'react';
import { useTableData } from '../hooks/useTableData';
import { useCrudForms } from '../hooks/useCrudForms';
import CrudMultiLevelManager from '../components/CrudMultiLevelManager';

/**
 * CrudMultiLevel - Componente CRUD completo para tablas multinivel
 * Wrapper sobre CrudMultiLevelManager para un único nivel/tabla CRUD.
 * Encapsula: header, tabla multinivel, footer, modales create/edit/delete, notificaciones
 *
 * @param {Object} tableConfig - { tableName, levelConfigs }
 * @param {Object} formConfig - { tableName, primaryKey, fields, layout, multiStep, confirmSubmit, validation }
 * @param {Object} modalConfig - { createTitle, editTitle, widthClass, deleteTitle, deleteMessage }
 * @param {Object} headerProps - { headerTitle, headerDescription, titleClassName, descriptionClassName, actions, createButtonText, createButtonIcon }
 * @param {Object} footerProps - Props para CrudFooter
 * @param {function} onSuccess - Callback éxito
 * @param {function} onError - Callback error
 */
function CrudMultiLevel({
  tableConfig = {},
  formConfig = {},
  modalConfig = {},
  headerProps = {},
  footerProps = {},
  onSuccess,
  onError
}) {
  const { tableName, levelConfigs = [] } = tableConfig;
  const { records, loading, error, refresh } = useTableData(tableName);

  const crud = useCrudForms({
    tableName: formConfig.tableName || tableName,
    primaryKey: formConfig.primaryKey || 'ID',
    onSuccess,
    onError,
    onRefresh: refresh
  });

  // Inyectar handlers en levelConfigs
  const enrichedLevelConfigs = levelConfigs.map(level => ({
    ...level,
    actions: level.actions
      ? {
          ...level.actions,
          edit: level.actions.edit
            ? { ...level.actions.edit, onClick: (row) => crud.handleEdit(row) }
            : undefined,
          delete: level.actions.delete
            ? { ...level.actions.delete, onClick: (row) => crud.handleDelete(row) }
            : undefined,
        }
      : undefined
  }));

  const headerActions = [
    ...(headerProps.actions || []),
    {
      text: headerProps.createButtonText || 'Nuevo',
      onClick: crud.handleCreate,
      font: 'bg-green-600 hover:bg-green-700 text-white',
      icon: headerProps.createButtonIcon || undefined
    }
  ];

  const fullHeaderProps = {
    headerTitle: headerProps.headerTitle,
    headerDescription: headerProps.headerDescription,
    titleClassName: headerProps.titleClassName,
    descriptionClassName: headerProps.descriptionClassName,
    actions: headerActions
  };

  return (
    <CrudMultiLevelManager
      data={records}
      loading={loading}
      error={error}
      tableLevelConfigs={enrichedLevelConfigs}
      headerProps={fullHeaderProps}
      footerProps={footerProps}
      crudLevels={[
        {
          crud,
          tableName: formConfig.tableName || tableName,
          primaryKey: formConfig.primaryKey || 'ID',
          formFields: formConfig.fields || [],
          formLayout: formConfig.layout || null,
          multiStep: formConfig.multiStep,
          validation: formConfig.validation,
          confirmSubmit: formConfig.confirmSubmit ?? true,
          modalConfig
        }
      ]}
    />
  );
}

export default CrudMultiLevel;
