import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserForm from "./pages/UserForm";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/Profile";
import Teachers from "./pages/Teachers";
import TeacherForm from "./pages/TeacherForm";
import TeacherImport from "./pages/TeacherImport";
import TeacherDetails from "./pages/TeacherDetails";
import TeacherEvaluations from "./pages/TeacherEvaluations";
import EvaluationForm from "./pages/EvaluationForm";
import EvaluationDetails from "./pages/EvaluationDetails";
// Importar el nuevo componente EvaluatorRoute
import EvaluatorRoute from "./components/EvaluatorRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminRoute>
            <Users />
          </AdminRoute>
        ),
      },
      {
        path: "users/new",
        element: (
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        ),
      },
      {
        path: "users/:id",
        element: (
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      // Actualizar las rutas de teachers para usar EvaluatorRoute en lugar de ProtectedRoute
      {
        path: "teachers",
        element: (
          <EvaluatorRoute>
            <Teachers />
          </EvaluatorRoute>
        ),
      },
      {
        path: "teachers/new",
        element: (
          <AdminRoute>
            <TeacherForm />
          </AdminRoute>
        ),
      },
      {
        path: "teachers/:id",
        element: (
          <AdminRoute>
            <TeacherForm />
          </AdminRoute>
        ),
      },
      {
        path: "teachers/:id/details",
        element: (
          <EvaluatorRoute>
            <TeacherDetails />
          </EvaluatorRoute>
        ),
      },
      {
        path: "teachers/import",
        element: (
          <AdminRoute>
            <TeacherImport />
          </AdminRoute>
        ),
      },
      // Las rutas de evaluaciones siguen siendo para evaluadores
      {
        path: "teachers/:id/evaluations",
        element: (
          <EvaluatorRoute>
            <TeacherEvaluations />
          </EvaluatorRoute>
        ),
      },
      {
        path: "teachers/:teacherId/evaluations/new",
        element: (
          <EvaluatorRoute>
            <EvaluationForm />
          </EvaluatorRoute>
        ),
      },
      {
        path: "teachers/:teacherId/evaluations/:evaluationId/edit",
        element: (
          <EvaluatorRoute>
            <EvaluationForm />
          </EvaluatorRoute>
        ),
      },
      {
        path: "teachers/:teacherId/evaluations/:evaluationId/view",
        element: (
          <EvaluatorRoute>
            <EvaluationDetails />
          </EvaluatorRoute>
        ),
      },
    ],
  },
]);
