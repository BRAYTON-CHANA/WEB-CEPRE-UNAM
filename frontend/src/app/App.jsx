import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/shared/context/AuthContext';
import { getRoleFlags } from '@/shared/utils/roles';
import '@/shared/theme/globals.css';

// Import pages
import Home from '@/app/views/home';
import Login from '@/app/views/login';
import RecoverPassword from '@/features/login/views/RecoverPassword';
import ChangePassword from '@/features/login/views/ChangePassword';
import Perfil from '@/app/views/perfil';
import Modules from '@/app/views/modules';
import TestDatabase from '@/app/views/modules/test-database';
import TestTable from '@/app/views/modules/test-table';
import FormTest from '@/app/views/modules/form-test';
import CrudPage from '@/app/views/modules/crud';
import TestFunction from '@/app/views/modules/test-function';
import TestSchedule from '@/app/views/modules/test-schedule';
import TestMultiLevelTable from '@/app/views/modules/test-multilevelTable';


import InfraestructuraConfig from '@/app/views/configuracion/academico/infraestructura';
import PeriodosConfig from '@/app/views/configuracion/gestion_periodo/periodos';
import TurnosConfig from '@/app/views/configuracion/gestion_periodo/turnos';
import CursosConfig from '@/app/views/configuracion/academico/cursos';
import AreasConfig from '@/app/views/configuracion/academico/areas';
import DocentesConfig from '@/app/views/configuracion/academico/docentes';
import HorariosConfig from '@/app/views/configuracion/academico/horarios';
import PlanesAcademicosConfig from '@/app/views/configuracion/academico/planes_academicos';
import ConvocatoriasConfig from '@/app/views/configuracion/gestion_periodo/contratacion_docente/convocatorias';
import GruposConfig from '@/app/views/configuracion/gestion_periodo/grupos';
import PostulantesConfig from '@/app/views/configuracion/gestion_periodo/postulantes';
import CarrerasConfig from '@/app/views/configuracion/academico/carreras';
import CorreosConfig from '@/app/views/configuracion/sistema/correos/correos';
import PasswordResetConfig from '@/app/views/configuracion/sistema/correos/password-reset';
import CuentasSmtpConfig from '@/app/views/configuracion/sistema/correos/cuentas-smtp';
import ReportesIndex from '@/app/views/configuracion/gestion_periodo/reportes';
import ReportesGrupos from '@/app/views/configuracion/gestion_periodo/reportes/grupos';
import ReportesPlazas from '@/app/views/configuracion/gestion_periodo/reportes/plazas';
import ReportesDocentes from '@/app/views/configuracion/gestion_periodo/reportes/docentes';
import UsuariosConfig from '@/app/views/configuracion/sistema/usuarios';
// import PermisosConfig from '@/app/views/configuracion/sistema/permisos';
import RolesConfig from '@/app/views/configuracion/sistema/roles';
import DocumentosPreguntasDocentesConfig from '@/app/views/configuracion/gestion_periodo/contratacion_docente/requisitos';


import Asistencias from '@/app/views/asistencias';
import AsistenciasGrupos from '@/app/views/asistencias/grupos';
import AsistenciasPorFecha from '@/app/views/asistencias/fechas';
import AsistenciasDocentes from '@/app/views/asistencias/docentes';
import AsistenciasEstudiantes from '@/app/views/asistencias/estudiantes';
import AsistenciasNuevo from '@/app/views/asistencias_nuevo';
import HorarioDocente from '@/app/views/horario';
import AsistenciasNuevoEstudiantes from '@/app/views/asistencias_nuevo/estudiantes';
import AsistenciasReportes from '@/app/views/asistencias/reportes';
import AsistenciasReportesDocentes from '@/app/views/asistencias/reportes/docentes';
import AsistenciasReportesEstudiantes from '@/app/views/asistencias/reportes/estudiantes';
import Configuracion from '@/app/views/configuracion';



function App() {
  const { isAuthenticated, user, activeRole } = useAuthContext();
  const location = useLocation();

  const publicRoutes = ['/login', '/recuperar-contrasena'];
  const authRoutes = ['/cambiar-contrasena'];

  const requiresPasswordChange = user?.REQUIERE_CAMBIO_PASSWORD || user?.requiereCambioPassword;

  if (isAuthenticated && requiresPasswordChange && !authRoutes.includes(location.pathname)) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
    sessionStorage.setItem('redirect_after_login', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && publicRoutes.includes(location.pathname) && !requiresPasswordChange) {
    return <Navigate to="/" replace />;
  }

  // Restricción por rol activo: módulos ocultos tampoco accesibles por URL
  if (isAuthenticated) {
    const path = location.pathname;
    const { esDocente, puedeVerConfiguracion, puedeVerAsistenciasViejo, puedeVerAsistenciasNuevo } = getRoleFlags(user, activeRole);
    const esRutaVieja = path === '/asistencias' || path.startsWith('/asistencias/');
    const bloqueado =
      (path.startsWith('/configuracion') && !puedeVerConfiguracion) ||
      (path.startsWith('/asistencias_nuevo') && !puedeVerAsistenciasNuevo) ||
      (path === '/horario' && !esDocente) ||
      (esRutaVieja && !puedeVerAsistenciasViejo);
    if (bloqueado) return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<RecoverPassword />} />
      <Route path="/cambiar-contrasena" element={<ChangePassword />} />
      <Route path="/perfil" element={<Perfil />} />
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
      <Route path="/horario" element={<HorarioDocente />} />
      <Route path="/asistencias_nuevo" element={<AsistenciasNuevo />} />
      <Route path="/asistencias_nuevo/estudiantes" element={<AsistenciasNuevoEstudiantes />} />
      <Route path="/asistencias/reportes" element={<AsistenciasReportes />} />
      <Route path="/asistencias/reportes/docentes" element={<AsistenciasReportesDocentes />} />
      <Route path="/asistencias/reportes/estudiantes" element={<AsistenciasReportesEstudiantes />} />

      <Route path="/configuracion" element={<Configuracion />} />

      <Route path="/configuracion/academico/infraestructura" element={<InfraestructuraConfig />} />

      <Route path="/configuracion/academico/areas" element={<AreasConfig />} />
      <Route path="/configuracion/academico/cursos" element={<CursosConfig />} />
      <Route path="/configuracion/academico/carreras" element={<CarrerasConfig />} />
      <Route path="/configuracion/academico/docentes" element={<DocentesConfig />} />
      <Route path="/configuracion/academico/planes_academicos" element={<PlanesAcademicosConfig />} />
      <Route path="/configuracion/academico/horarios" element={<HorariosConfig />} />
      <Route path="/configuracion/gestion_periodo/contratacion_docente/requisitos" element={<DocumentosPreguntasDocentesConfig />} />

      <Route path="/configuracion/gestion_periodo/periodos" element={<PeriodosConfig />} />
      <Route path="/configuracion/gestion_periodo/turnos" element={<TurnosConfig />} />
      <Route path="/configuracion/gestion_periodo/contratacion_docente/convocatorias" element={<ConvocatoriasConfig />} />
      <Route path="/configuracion/gestion_periodo/grupos" element={<GruposConfig />} />
      <Route path="/configuracion/gestion_periodo/postulantes" element={<PostulantesConfig />} />
      <Route path="/configuracion/sistema/usuarios" element={<UsuariosConfig />} />
      {/* <Route path="/configuracion/sistema/permisos" element={<PermisosConfig />} /> */}
      <Route path="/configuracion/sistema/roles" element={<RolesConfig />} />

      <Route path="/configuracion/sistema/correos/correos" element={<CorreosConfig />} />
      <Route path="/configuracion/sistema/correos/password-reset" element={<PasswordResetConfig />} />
      <Route path="/configuracion/sistema/correos/cuentas-smtp" element={<CuentasSmtpConfig />} />

      <Route path="/configuracion/gestion_periodo/reportes" element={<ReportesIndex />} />
      <Route path="/configuracion/gestion_periodo/reportes/grupos" element={<ReportesGrupos />} />
      <Route path="/configuracion/gestion_periodo/reportes/plazas" element={<ReportesPlazas />} />
      <Route path="/configuracion/gestion_periodo/reportes/docentes" element={<ReportesDocentes />} />
    </Routes>
  );
}

export default App;
