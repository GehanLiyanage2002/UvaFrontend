import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../../api';

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setMsg('Invalid or missing token.');
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post('/reset_password.php', { token, password });
      if (res.data.success) {
        navigate('/success', { state: { msg: res.data.message } });
      } else {
        setMsg(res.data.message);
      }
    } catch (err) {
      setMsg('Server error.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleReset} className="space-y-4 w-full max-w-sm">
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Reset Password
        </button>
        {msg && <p className="text-red-600">{msg}</p>}
      </form>
    </div>
  );
};

export default ResetPassword;
