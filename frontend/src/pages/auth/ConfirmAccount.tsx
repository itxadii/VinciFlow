// src/pages/auth/ConfirmAccount.tsx
import React, { useState } from 'react';
import { confirmSignUp } from 'aws-amplify/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ConfirmAccount() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      navigate('/login?confirmed=true');
    } catch (err) {
      alert("Invalid code. Please check your email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleConfirm} className="max-w-sm w-full p-8 text-center space-y-6">
        <h2 className="text-2xl font-bold">Verify Email</h2>
        <p className="text-gray-500 text-sm">We sent a code to <b>{email}</b></p>
        <input 
          type="text" 
          placeholder="6-digit code" 
          className="w-full text-center text-2xl tracking-[1em] py-4 border-b-2 outline-none"
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="w-full bg-black text-white py-3 rounded-xl font-bold">Verify & Launch</button>
      </form>
    </div>
  );
}