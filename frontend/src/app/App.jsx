import React from 'react';
import { Routes, Route } from 'react-router-dom';
import '@/shared/theme/globals.css';

// Import pages
import Home from '@/app/views/home';
import Modules from '@/app/views/modules';
import TestDatabase from '@/app/views/modules/test-database';
import TestTable from '@/app/views/modules/test-table';
import FormTest from '@/app/views/modules/form-test';
import CrudPage from '@/app/views/modules/crud';
import TestFunction from '@/app/views/modules/test-function';
import TestSchedule from '@/app/views/modules/test-schedule';
import TestMultiLevelTable from '@/app/views/modules/test-multilevelTable';


import InfraestructuraConfig from '@/app/views/configuracion/infraestructura';
import PeriodosConfig from '@/app/views/configuracion/periodo_academico/periodos';
import CursosConfig from '@/app/views/configuracion/academico/cursos';
import AreasYCursosConfig from '@/app/views/configuracion/academico/areas_cursos';
import DocentesYCursosConfig from '@/app/views/configuracion/academico/docentes_cursos';
import HorariosBloquesConfig from '@/app/views/configuracion/horarios/horarios_bloques';
import ConfigTurnosPage from '@/app/views/configuracion/horarios/turnos';
import PlanesAcademicosConfig from '@/app/views/configuracion/academico/planes_academicos';
import PlazasDocentesConfig from '@/app/views/configuracion/periodo_academico/plazas_docentes';
import GruposConfig from '@/app/views/configuracion/grupos';
import PostulantesConfig from '@/app/views/configuracion/periodo_academico/postulantes';
import CarrerasConfig from '@/app/views/configuracion/academico/carreras';
import ProgramacionGrupoConfig from '@/app/views/configuracion/periodo_academico/programacion_grupo';
// import ProgramacionPlazasDocentes from '@/app/views/configuracion/programacion_plazas_docentes'; // TEMP: En mantenimiento
import ReportesIndex from '@/app/views/configuracion/reportes';
import ReportesGrupos from '@/app/views/configuracion/reportes/grupos';
import ReportesPlazas from '@/app/views/configuracion/reportes/plazas';
import ReportesDocentes from '@/app/views/configuracion/reportes/docentes';


import Asistencias from '@/app/views/asistencias';
import AsistenciasGrupos from '@/app/views/asistencias/grupos';
import AsistenciasPorFecha from '@/app/views/asistencias/fechas';
import AsistenciasDocentes from '@/app/views/asistencias/docentes';
import AsistenciasEstudiantes from '@/app/views/asistencias/estudiantes';
import AsistenciasReportes from '@/app/views/asistencias/reportes';
import AsistenciasReportesDocentes from '@/app/views/asistencias/reportes/docentes';
import AsistenciasReportesEstudiantes from '@/app/views/asistencias/reportes/estudiantes';
import Configuracion from '@/app/views/configuracion';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/modules/test-database" element={<TestDatabase />} />
      <Route path="/modules/test-table" element={<TestTable />} />
      <Route path="/modules/form-test" element={<FormTest />} />
      <Route path="/modules/crud" element={<CrudPage />} />
      <Route path="/modules/test-function" element={<TestFunction />} />
      <Route path="/modules/test-schedule" element={<TestSchedule />} />
      <Route path="/modules/test-multilevelTable" element={<TestMultiLevelTable />} />
      

      <Route path="/asistencias" element={<Asistencias />} />
      <Route path="/asistencias/grupos" element={<AsistenciasGrupos />} />
      <Route path="/asistencias/fechas" element={<AsistenciasPorFecha />} />
      <Route path="/asistencias/docentes" element={<AsistenciasDocentes />} />
      <Route path="/asistencias/estudiantes" element={<AsistenciasEstudiantes />} />
      <Route path="/asistencias/reportes" element={<AsistenciasReportes />} />
      <Route path="/asistencias/reportes/docentes" element={<AsistenciasReportesDocentes />} />
      <Route path="/asistencias/reportes/estudiantes" element={<AsistenciasReportesEstudiantes />} />

      <Route path="/configuracion" element={<Configuracion />} />

      <Route path="/configuracion/infraestructura" element={<InfraestructuraConfig />} />
     
      <Route path="/configuracion/cursos" element={<CursosConfig />} />
      <Route path="/configuracion/areas_cursos" element={<AreasYCursosConfig />} />
      <Route path="/configuracion/carreras" element={<CarrerasConfig />} />
      <Route path="/configuracion/docentes_cursos" element={<DocentesYCursosConfig />} />
      <Route path="/configuracion/planes_academicos" element={<PlanesAcademicosConfig />} />
     
      <Route path="/configuracion/horarios_bloques" element={<HorariosBloquesConfig />} />
      <Route path="/configuracion/turnos" element={<ConfigTurnosPage />} />
      <Route path="/configuracion/plazas_docentes" element={<PlazasDocentesConfig />} />
      <Route path="/configuracion/grupos" element={<GruposConfig />} />
      <Route path="/configuracion/postulantes" element={<PostulantesConfig />} />

      <Route path="/configuracion/periodos" element={<PeriodosConfig />} />
      <Route path="/configuracion/programacion_grupo" element={<ProgramacionGrupoConfig />} />
      {/* <Route path="/configuracion/programacion_plazas_docentes" element={<ProgramacionPlazasDocentes />} /> TEMP: En mantenimiento */}
      <Route path="/configuracion/reportes" element={<ReportesIndex />} />
      <Route path="/configuracion/reportes/grupos" element={<ReportesGrupos />} />
      <Route path="/configuracion/reportes/plazas" element={<ReportesPlazas />} />
      <Route path="/configuracion/reportes/docentes" element={<ReportesDocentes />} />
    </Routes>
  );
}

export default App;
