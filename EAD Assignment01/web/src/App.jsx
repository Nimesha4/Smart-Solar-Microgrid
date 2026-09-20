import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BackofficeDashboard from './pages/BackofficeDashboard';
import GridOperatorDashboard from './pages/GridOperatorDashboard';
import ProsumerDashboard from './pages/ProsumerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/backoffice" element={<BackofficeDashboard />} />
        <Route path="/operator" element={<GridOperatorDashboard />} />
        <Route path="/prosumer" element={<ProsumerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
