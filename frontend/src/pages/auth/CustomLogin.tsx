// src/pages/auth/CustomLogin.tsx
import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function CustomLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-blue-600">VinciFlow</h2>
          <p className="mt-2 text-gray-500">Sign in to your AI workspace</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          New here? <Link to="/signup" className="text-blue-600 font-bold">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}