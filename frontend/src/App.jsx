// 42Nexus - Main App Component
// This file is for: FATYZA (Frontend Developer)
// Description: Main router and app structure

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Votes from './pages/Votes';
import Disputes from './pages/Disputes';
import Tests from './pages/Tests';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-42-teal"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="resources" element={<Resources />} />
          <Route path="votes" element={<Votes />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="tests" element={<Tests />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
