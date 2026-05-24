// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login      from './pages/Login';
import Signup     from './pages/Signup';
import Dashboard  from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile    from './pages/Profile';
import Settings   from './pages/Settings';

// Theme-aware Toaster so toast colours match the current theme
function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background:  isDark ? '#0a1520' : '#ffffff',
          border:      isDark ? '1px solid rgba(0,245,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
          color:       isDark ? '#e2e8f0' : '#0f172a',
          fontFamily: '"Exo 2", sans-serif',
          fontSize:   '0.85rem',
          borderRadius: '8px',
          boxShadow:  isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.1)',
        },
        success: {
          iconTheme: { primary: isDark ? '#00f5ff' : '#0097a7', secondary: isDark ? '#020408' : '#f1f5f9' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: isDark ? '#020408' : '#f1f5f9' },
        },
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ThemedToaster />

          <Routes>
            {/* Public routes */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route path="/dashboard"   element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
            <Route path="/profile"     element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/settings"    element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

            {/* Default redirect */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
