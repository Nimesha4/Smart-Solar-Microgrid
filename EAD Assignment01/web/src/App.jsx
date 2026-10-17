import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BackofficeDashboard from './pages/BackofficeDashboard';
import GridOperatorDashboard from './pages/GridOperatorDashboard';
import ProsumerDashboard from './pages/ProsumerDashboard';
import TransactionsPage from './pages/TransactionsPage';
import { getStoredUser, getToken, getDefaultRouteForRole } from './auth';

function ProtectedRoute({ allowedRoles = [] }) {
  const user = getStoredUser();
  const token = getToken();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role) || '/login'} replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute allowedRoles={['Backoffice']} />}>
          <Route path="/backoffice" element={<BackofficeDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['GridOperator']} />}>
          <Route path="/operator" element={<GridOperatorDashboard />} />
          <Route path="/grid-operator/transactions" element={<TransactionsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Prosumer']} />}>
          <Route path="/prosumer" element={<ProsumerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
