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
import DatosDashboard from '@/app/views/datos';

import SedesYAulasConfig from '@/app/views/configuracion/sedes_aulas';
import PeriodosConfig from '@/app/views/configuracion/periodos';
import CursosConfig from '@/app/views/configuracion/cursos';
import AreasYCursosConfig from '@/app/views/configuracion/areas_cursos';
import DocentesYCursosConfig from '@/app/views/configuracion/docentes_cursos';
import HorariosBloquesConfig from '@/app/views/configuracion/horarios_bloques';
import ConfigTurnosPage from '@/app/views/configuracion/turnos';
import PlanesAcademicosConfig from '@/app/views/configuracion/planes_academicos';
import PlazasDocentesConfig from '@/app/views/configuracion/plazas_docentes';
import GruposConfig from '@/app/views/configuracion/grupos';
import ProgramacionGrupoConfig from '@/app/views/configuracion/programacion_grupo';
import ProgramacionPlazasDocentes from '@/app/views/configuracion/programacion_plazas_docentes';


import AsignacionHorarioGrupo from '@/app/views/datos/asignacion_horario_grupo';
import AsignacionHorarioDocente from '@/app/views/datos/asignacion_horario_docente';
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
      
      <Route path="/datos" element={<DatosDashboard />} />

      <Route path="/datos/asignacion_horario_grupo" element={<AsignacionHorarioGrupo />} />
      <Route path="/datos/asignacion_horario_docente" element={<AsignacionHorarioDocente />} />
      
      <Route path="/configuracion" element={<Configuracion />} />

      <Route path="/configuracion/sedes_aulas" element={<SedesYAulasConfig />} />
     
      <Route path="/configuracion/cursos" element={<CursosConfig />} />
      <Route path="/configuracion/areas_cursos" element={<AreasYCursosConfig />} />
      <Route path="/configuracion/docentes_cursos" element={<DocentesYCursosConfig />} />
      <Route path="/configuracion/planes_academicos" element={<PlanesAcademicosConfig />} />
     
      <Route path="/configuracion/horarios_bloques" element={<HorariosBloquesConfig />} />
      <Route path="/configuracion/turnos" element={<ConfigTurnosPage />} />
      <Route path="/configuracion/plazas_docentes" element={<PlazasDocentesConfig />} />
      <Route path="/configuracion/grupos" element={<GruposConfig />} />

      <Route path="/configuracion/periodos" element={<PeriodosConfig />} />
      <Route path="/configuracion/programacion_grupo" element={<ProgramacionGrupoConfig />} />
      <Route path="/configuracion/programacion_plazas_docentes" element={<ProgramacionPlazasDocentes />} />
    </Routes>
  );
}

export default App;
