import React from 'react';
import { Routes, Route } from 'react-router-dom';
import '@/shared/theme/globals.css';

// Import pages
import Home from '@/app/views/home';
import Modules from '@/app/views/modules';
import Test from '@/app/views/modules/tests';
import TestTable from '@/app/views/modules/test-table';
import FormTest from '@/app/views/modules/form-test';
import CrudPage from '@/app/views/modules/crud';
import TestFunction from '@/app/views/modules/test-function';
import TestSchedule from '@/app/views/modules/test-schedule';
import DatosDashboard from '@/app/views/datos';
import SedesConfig from '@/app/views/configuracion/sedes';
import TurnosConfig from '@/app/views/datos/turnos';
import AreasConfig from '@/app/views/configuracion/areas';
import AulasConfig from '@/app/views/datos/aulas';
import PeriodosConfig from '@/app/views/datos/periodos';
import DocentesConfig from '@/app/views/datos/docentes';
import CursosConfig from '@/app/views/datos/cursos';
import CursoAreaConfig from '@/app/views/datos/curso_area';
import DocenteCursoConfig from '@/app/views/datos/docente_curso';
import DocentePeriodoConfig from '@/app/views/datos/docente_periodo';
import GruposConfig from '@/app/views/datos/grupos';
import PlanAcademicoConfig from '@/app/views/datos/plan_academico';

import VistaHorariosConfig from '@/app/views/datos/vista_horarios';
import AsignacionHorarioGrupo from '@/app/views/datos/asignacion_horario_grupo';
import AsignacionHorarioDocente from '@/app/views/datos/asignacion_horario_docente';
import Configuracion from '@/app/views/configuracion';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/modules/tests" element={<Test />} />
      <Route path="/modules/test-table" element={<TestTable />} />
      <Route path="/modules/form-test" element={<FormTest />} />
      <Route path="/modules/crud" element={<CrudPage />} />
      <Route path="/modules/test-function" element={<TestFunction />} />
      <Route path="/modules/test-schedule" element={<TestSchedule />} />
      <Route path="/datos" element={<DatosDashboard />} />
      <Route path="/datos/turnos" element={<TurnosConfig />} />
      <Route path="/datos/aulas" element={<AulasConfig />} />
      <Route path="/datos/curso_area" element={<CursoAreaConfig />} />
      <Route path="/datos/docente_curso" element={<DocenteCursoConfig />} />

      <Route path="/datos/periodos" element={<PeriodosConfig />} />
      <Route path="/datos/docente_periodo" element={<DocentePeriodoConfig />} />
      <Route path="/datos/docentes" element={<DocentesConfig />} />
      <Route path="/datos/cursos" element={<CursosConfig />} />
      <Route path="/datos/grupos" element={<GruposConfig />} />
      <Route path="/datos/plan_academico" element={<PlanAcademicoConfig />} />

      <Route path="/datos/vista_horarios" element={<VistaHorariosConfig />} />
      <Route path="/datos/asignacion_horario_grupo" element={<AsignacionHorarioGrupo />} />
      <Route path="/datos/asignacion_horario_docente" element={<AsignacionHorarioDocente />} />
      <Route path="/configuracion" element={<Configuracion />} />


      <Route path="/configuracion/sedes" element={<SedesConfig />} />
      <Route path="/configuracion/areas" element={<AreasConfig />} />
     
    </Routes>
  );
}

export default App;
