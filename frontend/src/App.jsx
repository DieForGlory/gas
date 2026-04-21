import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import Audit from './pages/Audit';
import ValveTypesPage from './pages/ValveTypes';
import Layout from './components/Layout';
import SubscriberView from './pages/subscriber/SubscriberView';
import SubscriberDevices from './pages/subscriber/SubscriberDevices';
import SubscriberLogs from './pages/subscriber/SubscriberLogs';
import SubscriberSettings from './pages/subscriber/SubscriberSettings';
import Firmware from './pages/Firmware';
import PasswordReset from './pages/PasswordReset';
// Необходимо создать или импортировать компонент Verify2FA, если он был ранее
import Verify2FA from './pages/Verify2FA';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" replace />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/verify-2fa" element={<Verify2FA setToken={setToken} />} />

        {/* Защищенные маршруты */}
        <Route
          path="/*"
          element={
            token ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/subscriber/:id" element={<SubscriberView />}>
                    <Route index element={<SubscriberDevices />} />
                    <Route path="logs" element={<SubscriberLogs />} />
                    <Route path="settings" element={<SubscriberSettings />} />
                  </Route>
                  <Route path="/firmware" element={<ProtectedRoute allowedRoles={['ADMIN']}><Firmware /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'REGIONAL']}><UsersPage /></ProtectedRoute>} />
                  <Route path="/audit" element={<ProtectedRoute allowedRoles={['ADMIN']}><Audit /></ProtectedRoute>} />
                  <Route path="/valve-types" element={<ProtectedRoute allowedRoles={['ADMIN']}><ValveTypesPage /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;