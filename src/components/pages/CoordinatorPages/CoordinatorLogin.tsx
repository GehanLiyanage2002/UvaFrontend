import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loginImage from '../../../assets/loginIllustration.png';

const CoordinatorLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setSubmitted(true);
    setMessage('');

    if (!email || !password) {
      setMessage('All fields are required.');
      return;
    }

    if (!email.endsWith('@uwu.ac.lk')) {
      setMessage('Please use a valid UWU coordinator email.');
      return;
    }

    try {
      // CoordinatorLoginPage.tsx (inside handleLogin)
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/login.php`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // keep session cookie
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/coordinator/dashboard');
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (err) {
      setMessage('Server error, please try again');
    }
  };


  return (
    <div className="w-screen h-screen flex items-center justify-center bg-cyan-100 px-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-xl border border-gray-300 bg-white">
        <div className="w-full md:w-1/2 bg-cyan-50 flex items-center justify-center p-4">
          <img src={loginImage} alt="Login Illustration" className="object-contain w-[90%] max-h-[360px]" />
        </div>
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-center mb-2 text-cyan-900">Coordinator Login</h2>
          <p className="text-sm text-center text-gray-500 mb-6">Enter your registered UWU email</p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="coordinator@uwu.ac.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${submitted && !email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-600'}`}
            />
            {submitted && !email && (
              <p className="text-xs text-red-500 mt-1">Email is required</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${submitted && !password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-600'}`}
            />
            {submitted && !password && (
              <p className="text-xs text-red-500 mt-1">Password is required</p>
            )}
          </div>

          <div className="flex justify-end mb-4 text-sm">
            <span
              className="text-cyan-700 hover:underline cursor-pointer"
              onClick={() => navigate('/forgot-coordinator')}
            >
              Forgotten Password?
            </span>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-cyan-900 hover:bg-cyan-800 text-white py-2 rounded-md transition"
          >
            Sign in
          </button>

          {message && (
            <p className="text-sm text-center text-red-600 mt-4">{message}</p>
          )}

          <p className="text-xs text-center mt-6 text-gray-500">
            © 2025 All Rights Reserved by IIT 16
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorLoginPage;