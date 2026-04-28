import React, { useState } from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';
import { 
  tableConfig, 
  formConfig, 
  tableComponentParameters, 
  modalConfig 
} from './config/planAcademicoConfig';
import { 
  planAcademicoCursosTableConfig, 
  planAcademicoCursosFormConfig, 
  planAcademicoCursosTableComponentParameters, 
  planAcademicoCursosModalConfig 
} from './config/planAcademicoCursosConfig';
import { menuFilters } from './config/menuFiltersConfig';
import { headerProps, footerProps } from './config/headerFooterConfig';

/**
 * Configuración de PLAN ACADÉMICO
 * CRUD completo para la tabla PLAN_ACADEMICO
 * Asigna cursos-área a períodos con docente opcional
 */
function PlanAcademicoConfig() {
  const [showCursos, setShowCursos] = useState(false);
  const [selectedIdPlan, setSelectedIdPlan] = useState(null);
  const [selectedPlanDescripcion, setSelectedPlanDescripcion] = useState(null);






  // ==========================================
  // 8. ACCIONES PERSONALIZADAS
  // ==========================================
  
  const handleViewCursos = (row) => {
    setSelectedIdPlan(row.ID_PLAN);
    setSelectedPlanDescripcion(row.DESCRIPCION);
    setShowCursos(true);
  };

  const handleBackToPlanes = () => {
    setShowCursos(false);
    setSelectedIdPlan(null);
    setSelectedPlanDescripcion(null);
  };

  const actions = {
    custom: [
      {
        icon: 'eye',
        label: 'Ver Detalle',
        onClick: handleViewCursos
      }
    ]
  };

  // ==========================================
  // 9. CALLBACKS
  // ==========================================
  const handleSuccess = (result) => {
    console.log('Operación exitosa en PLAN_ACADEMICO:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación PLAN_ACADEMICO:', error);
  };

  return (
    <Layout>
      {/* PLAN_ACADEMICO table - only show when not in cursos view */}
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
      
      {/* PLAN_ACADEMICO_CURSOS table - only show when showCursos is true */}
      {showCursos && (
        <div className="space-y-8 px-4 py-6">
          {/* Back button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToPlanes}
              className="px-5 py-2.5 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Planes
            </button>
          </div>
          
          <Crud
            tableConfig={planAcademicoCursosTableConfig}
            formConfig={planAcademicoCursosFormConfig(selectedIdPlan)}
            tableComponentParameters={planAcademicoCursosTableComponentParameters(selectedIdPlan)}
            modalConfig={planAcademicoCursosModalConfig}
            headerProps={{
              headerTitle: `PLAN DE ${selectedPlanDescripcion}`,
              headerDescription: 'Gestión de cursos dentro del plan académico',
              titleClassName: '',
              descriptionClassName: '',
              actions: []
            }}
            footerProps={footerProps}
            actions={{}}
            onSuccess={(result) => {
              handleSuccess(result);
            }}
            onError={handleError}
          />
        </div>
      )}
    </Layout>
  );
}

export default PlanAcademicoConfig;
