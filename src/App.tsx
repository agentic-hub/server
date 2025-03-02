import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';

// Components
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import IntegrationDetail from './pages/IntegrationDetail';
import ApiTest from './pages/ApiTest';
import Toolkits from './pages/Toolkits';
import ToolkitDetail from './pages/ToolkitDetail';
import Tools from './pages/Tools';
import ToolDetail from './pages/ToolDetail';

function App() {
  const { setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Check for active session on load
    const checkSession = async () => {
      setLoading(true);
      
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setLoading(false);
      
      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user || null);
        }
      );
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    checkSession();
  }, [setUser, setSession, setLoading]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="dashboard" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          <Route path="integrations" element={
            <AuthGuard>
              <Integrations />
            </AuthGuard>
          } />
          <Route path="integrations/:id" element={
            <AuthGuard>
              <IntegrationDetail />
            </AuthGuard>
          } />
          <Route path="api-test/:id" element={
            <AuthGuard>
              <ApiTest />
            </AuthGuard>
          } />
          <Route path="toolkits" element={
            <AuthGuard>
              <Toolkits />
            </AuthGuard>
          } />
          <Route path="toolkits/:id" element={
            <AuthGuard>
              <ToolkitDetail />
            </AuthGuard>
          } />
          <Route path="tools" element={
            <AuthGuard>
              <Tools />
            </AuthGuard>
          } />
          <Route path="tools/:id" element={
            <AuthGuard>
              <ToolDetail />
            </AuthGuard>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;