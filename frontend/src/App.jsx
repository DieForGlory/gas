import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import Audit from './pages/Audit';
import Layout from './components/Layout';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (!token) return <Login setToken={setToken} />;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<Audit />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;