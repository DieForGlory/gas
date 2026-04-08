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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!token ? <Login setToken={setToken} /> : <Navigate to="/" replace />}
        />
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
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/audit" element={<Audit />} />
                  <Route path="/valves" element={<ValveTypesPage />} />
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