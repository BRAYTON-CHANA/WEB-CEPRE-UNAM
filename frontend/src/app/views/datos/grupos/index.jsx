import React, { useState } from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';
import { 
  tableConfig, 
  formConfig, 
  tableComponentParameters, 
  modalConfig 
} from './config/gruposConfig';
import { 
  cursosTableConfig, 
  cursosFormConfig, 
  cursosTableComponentParameters, 
  cursosModalConfig 
} from './config/cursosConfig';
import { menuFilters } from './config/menuFiltersConfig';
import { headerProps, footerProps } from './config/headerFooterConfig';

/**
 * Configuración de GRUPOS
 * CRUD completo para la tabla GRUPOS
 * Formulario en 4 pasos: Período → Área → Turno → Aula + datos adicionales
 */
function GruposConfig() {
  const [showCursos, setShowCursos] = useState(false);
  const [selectedIdGrupo, setSelectedIdGrupo] = useState(null);
  const [selectedIdPlan, setSelectedIdPlan] = useState(null);
  const [selectedGrupoNombre, setSelectedGrupoNombre] = useState(null);
  // ==========================================
  // 8. ACCIONES PERSONALIZADAS
  // ==========================================
  const handleViewCursos = (row) => {
    setSelectedIdGrupo(row.ID_GRUPO);
    setSelectedIdPlan(row.ID_PLAN);
    setSelectedGrupoNombre(row.NOMBRE_GRUPO);
    setShowCursos(true);
  };

  const handleBackToGrupos = () => {
    setShowCursos(false);
    setSelectedIdGrupo(null);
    setSelectedIdPlan(null);
    setSelectedGrupoNombre(null);
  };

  const actions = {
    custom: [
      {
        icon: 'eye',
        label: 'Ver Cursos',
        onClick: handleViewCursos
      }
    ]
  };

  // ==========================================
  // 9. CALLBACKS
  // ==========================================
  const handleSuccess = (result) => {
    console.log('Operación exitosa en GRUPOS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación GRUPOS:', error);
  };

  return (
    <Layout>
      {/* GRUPOS table - only show when not in cursos view */}
      {!showCursos && (
        <Crud
          tableConfig={tableConfig}
          formConfig={formConfig}
          tableComponentParameters={tableComponentParameters}
          menuFilters={menuFilters}
          modalConfig={modalConfig}
          headerProps={headerProps}
          footerProps={footerProps}
          actions={actions}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      
      {/* CURSOS table - only show when showCursos is true */}
      {showCursos && (
        <div className="space-y-8 px-4 py-6">
          {/* Back button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToGrupos}
              className="px-5 py-2.5 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Grupos
            </button>
          </div>
          
          <Crud
            tableConfig={cursosTableConfig}
            formConfig={cursosFormConfig(selectedIdGrupo, selectedIdPlan)}
            tableComponentParameters={cursosTableComponentParameters(selectedIdGrupo, selectedIdPlan)}
            modalConfig={cursosModalConfig}
            headerProps={{
              headerTitle: `CURSOS DEL GRUPO: ${selectedGrupoNombre}`,
              headerDescription: 'Gestión de cursos del plan académico asignados al grupo',
              titleClassName: '',
              descriptionClassName: '',
              actions: []
            }}
            footerProps={footerProps}
            actions={{}}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      )}
    </Layout>
  );
}

export default GruposConfig;
