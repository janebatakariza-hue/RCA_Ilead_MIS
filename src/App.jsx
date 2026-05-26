import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Roundtables from './pages/Roundtables';
import Statistics from './pages/Statistics';
import Logs from './pages/Logs';
import Login from './pages/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#fdfaf6',
              color: '#5c3a21',
              border: '1px solid #e0d5c1',
              fontWeight: '500'
            },
          }} 
        />
        {token && <Navbar />}

        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/students" element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          } />
          
          <Route path="/roundtables" element={
            <ProtectedRoute>
              <Roundtables />
            </ProtectedRoute>
          } />
          
          <Route path="/statistics" element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          } />

          <Route path="/logs" element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}