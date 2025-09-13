import React, { useState } from 'react';
import axios from '../../../api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("Submit clicked"); // ✅ Check this in console
  try {
    const res = await axios.post('/forgot_password.php', { email });
    console.log(res.data); // ✅ See response
  } catch (err) {
    console.error("Axios error:", err); // ✅ See if there's a network error
  }
};

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Send Reset Link
        </button>
        {message && <p className="text-red-600">{message}</p>}
      </form>
    </div>
  );
};

export default ForgotPassword;
