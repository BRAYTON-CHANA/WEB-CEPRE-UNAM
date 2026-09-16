import React from 'react';
import { useTurnos } from '@/features/turnos/turnos/hooks/useTurnos';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { headerProps, getHeaderActions } from '@/features/turnos/turnos/config/headerConfig';
import { TURNO_BLOQUES_CONFIG } from '@/features/turnos/turnos/config/tableConfig';
import TurnoFormModal from '@/features/turnos/turnos/components/TurnoFormModal';
import EditarBloquesView from '@/shared/components/schedule/components/EditarBloquesView';

export default function TurnosPanel() {
  const {
    records,
    loading,
    error,
    crudLevels,
    tableLevelConfigs,
    isModalOpen,
    editingTurno,
    editingBloquesTurno,
    bloquesCrud,
    setNextBloqueOrden,
    handleBackToTurnos,
    formData,
    formErrors,
    saving,
    periodoOptions,
    horarioOptions,
    sedeOptions,
    openCreate,
    closeModal,
    setField,
    handlePeriodoChange,
    applyHorarioTemplate,
    generarMatriz,
    handleSubmit,
    refresh
  } = useTurnos();

  return (
    <>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {() => editingBloquesTurno ? (
          <EditarBloquesView
            row={editingBloquesTurno}
            bloquesCrud={bloquesCrud}
            onBack={handleBackToTurnos}
            onNextOrdenChange={setNextBloqueOrden}
            config={TURNO_BLOQUES_CONFIG}
          />
        ) : (
          <div className="px-8 py-8 space-y-8 pb-12">
            <CrudHeader
              headerTitle={headerProps.headerTitle}
              headerDescription={headerProps.headerDescription}
              actions={getHeaderActions({ handleCreate: openCreate })}
            />

            <TableMultiLevelEditable
              data={records}
              levelConfigs={tableLevelConfigs}
              saveMode="auto"
              tableProps={{ pagination: true, itemsPerPage: 100 }}
              externalLoading={loading}
              externalError={error}
              searchFields={['NOMBRE_TURNO', 'NOMBRE_SEDE', 'CODIGO_PERIODO']}
              onSaveSuccess={refresh}
              onRefreshExternal={refresh}
            />
          </div>
        )}
      </CrudMultiLevelManager>

      <TurnoFormModal
        isOpen={isModalOpen}
        editingTurno={editingTurno}
        formData={formData}
        formErrors={formErrors}
        saving={saving}
        periodoOptions={periodoOptions}
        horarioOptions={horarioOptions}
        sedeOptions={sedeOptions}
        onClose={closeModal}
        onFieldChange={setField}
        onPeriodoChange={handlePeriodoChange}
        onApplyHorarioTemplate={applyHorarioTemplate}
        onGenerarMatriz={generarMatriz}
        onSubmit={handleSubmit}
      />
    </>
  );
}
