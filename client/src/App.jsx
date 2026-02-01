import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainMenu from './pages/MainMenu';
import GameView from './pages/GameView';
import Editor from './pages/Editor';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="logo">CorePlayBlox</div><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/play/:gameId?" element={<PrivateRoute><GameView /></PrivateRoute>} />
      <Route path="/editor/:mapId?" element={<PrivateRoute><Editor /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
