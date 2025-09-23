// src/pages/auth/AuthPage.tsx
import React, { useState } from 'react';
import registerImage from '../../../assets/loginIllustration.png';
import { postJSON, saveAuth } from '../../../lib/api';

type RegisterResponse = { success: boolean; message?: string };
type LoginResponse = {
  success: boolean;
  token?: string;
  user?: { id: number; name: string; email: string; role: 'member'|'manager' };
  message?: string;
};

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('register');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Register-only
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'member' | 'manager'>('member');

  // Login-only
  const [remember, setRemember] = useState(true);

  const isPasswordStrong = (pwd: string) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

  const handleRegister = async () => {
    setMessage('');
    if (!name || !email || !password || !confirmPassword) {
      setMessage('All fields are required.');
      return;
    }
    if (!email.endsWith('@std.uwu.ac.lk') && !email.endsWith('@uwu.ac.lk')) {
      setMessage('Use a valid university email.');
      return;
    }
    if (!isPasswordStrong(password)) {
      setMessage('Password must be at least 8 characters, include 1 uppercase letter and 1 number.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const result = await postJSON<RegisterResponse>('/api/register.php', {
        name, email: email.toLowerCase().trim(), password, role
      });
      setMessage(result.success ? 'Registration successful! Please login.' : (result.message || 'Registration failed.'));
      if (result.success) {
        setName(''); setPassword(''); setConfirmPassword(''); setRole('member');
        setMode('login');
      }
    } catch (e: any) {
      setMessage(e?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setMessage('');
    if (!email || !password) {
      setMessage('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await postJSON<LoginResponse>('/api/login.php', {
        email: email.toLowerCase().trim(),
        password,
        remember
      });
      if (res.success && res.token && res.user) {
        saveAuth({ token: res.token, user: res.user }, remember);
        setMessage('Login successful!');
        // TODO: navigate based on role if needed
        // if (res.user.role === 'manager') navigate('/manager');
        // else navigate('/member');
      } else {
        setMessage(res.message || 'Login failed.');
      }
    } catch (e: any) {
      setMessage(e?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex bg-green-100">
      <div className="w-1/2 hidden lg:flex items-center justify-center bg-green-200">
        <img src={registerImage} alt="Illustration" className="object-contain w-[90%] max-h-[90%]" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg border-t-4 border-green-600">
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 rounded-l-md border ${mode==='register' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
              onClick={() => { setMode('register'); setMessage(''); }}
            >
              Register
            </button>
            <button
              className={`flex-1 py-2 rounded-r-md border ${mode==='login' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
              onClick={() => { setMode('login'); setMessage(''); }}
            >
              Login
            </button>
          </div>

          {mode === 'register' ? (
            <>
              <h2 className="text-2xl font-bold text-center text-green-700 mb-2">Create Your Account</h2>
              <p className="text-sm text-center text-gray-500 mb-6">Only university emails are allowed</p>

              <div className="mb-4">
                <label className="block font-medium mb-1 text-sm">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1 text-sm">Email</label>
                <input
                  type="email"
                  placeholder="Enter your university email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1 text-sm">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 chars, 1 uppercase & 1 digit"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1 text-sm">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-5">
                <label className="block font-medium mb-2 text-sm">Register As</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="member" checked={role === 'member'} onChange={() => setRole('member')} />
                    Member
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="manager" checked={role === 'manager'} onChange={() => setRole('manager')} />
                    Project Manager
                  </label>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center text-green-700 mb-6">Welcome Back</h2>

              <div className="mb-4">
                <label className="block font-medium mb-1 text-sm">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1 text-sm">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-6 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={remember} onChange={() => setRemember(v => !v)} />
                  Remember me
                </label>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </>
          )}

          {message && <p className="text-sm text-center text-red-600 mt-4">{message}</p>}

          <p className="text-xs text-center mt-6 text-gray-500">© 2025 All Rights Reserved by IIT 16</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
