import React, { useState } from 'react';
import { authService } from '../services/api';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authService.login(username, password); //
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err) {
      alert('Ошибка авторизации');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
        <input
          type="text" placeholder="Логин" className="w-full border p-2 mb-4 rounded"
          value={username} onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password" placeholder="Пароль" className="w-full border p-2 mb-6 rounded"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Войти
        </button>
      </form>
    </div>
  );
};

export default Login;