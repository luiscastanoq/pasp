import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../features/auth/context/useAuth';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { EditarAdminPage } from '../features/admin/pages/EditarAdminPage';
import { EditarBecarioPage } from '../features/admin/pages/EditarBecarioPage';
import { EditarTutorEmpresaPage } from '../features/admin/pages/EditarTutorEmpresaPage';
import { EditarTutorAcademicoPage } from '../features/admin/pages/EditarTutorAcademicoPage';
import { NuevoUsuarioPage } from '../features/admin/pages/NuevoUsuarioPage';
import { BecarioProfile } from '../features/becarios/pages/BecarioProfile';
import { Login } from '../features/auth/components/Login';
import { TutorDashboard } from '../features/tutores/pages/TutorDashboard';
import { TutorAcademicoBecarioPage } from '../features/tutores/pages/TutorAcademicoBecarioPage';
import { TutorAcademicoDashboard } from '../features/tutores/pages/TutorAcademicoDashboard';
import { TutorAcademicoEvaluacionesPage } from '../features/tutores/pages/TutorAcademicoEvaluacionesPage';
import { TutorEditarBecarioPage } from '../features/tutores/pages/TutorEditarBecarioPage';
import { TutorNuevoBecarioPage } from '../features/tutores/pages/TutorNuevoBecarioPage';
import { RoleRedirect } from '../features/auth/components/RoleRedirect';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { OtrosRolesDashboard } from '../features/auth/pages/OtrosRolesDashboard';
import { ROLES } from '../shared/constants/domain.constants';

export function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={user ? <RoleRedirect /> : <Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/nuevo-usuario"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <NuevoUsuarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuario/:id/editar"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <EditarAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/editar-tutor-academico/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <EditarTutorAcademicoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/editar-tutor-empresa/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <EditarTutorEmpresaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/editar-becario/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <EditarBecarioPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tutor"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TUTOR_EMPRESA]}>
            <TutorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor/nuevo-becario"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TUTOR_EMPRESA]}>
            <TutorNuevoBecarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor/editar-becario/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TUTOR_EMPRESA]}>
            <TutorEditarBecarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor-academico"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TUTOR_ACADEMICO]}>
            <TutorAcademicoDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor-academico/becario/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TUTOR_ACADEMICO]}>
            <TutorAcademicoBecarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor-academico/becario/:id/evaluaciones"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TUTOR_ACADEMICO]}>
            <TutorAcademicoEvaluacionesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/becario"
        element={
          <ProtectedRoute allowedRoles={[ROLES.BECARIO]}>
            <BecarioProfile />
          </ProtectedRoute>
        }
      />

      <Route path="/otros" element={<OtrosRolesDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
