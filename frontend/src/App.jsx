import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import Aptitude from './pages/Aptitude';
import Jobs from './pages/Jobs';
import Interview from './pages/Interview';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/aptitude" element={<Aptitude />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
