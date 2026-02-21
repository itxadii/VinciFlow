// src/pages/auth/CustomSignUp.tsx
import React, { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function CustomSignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    brandVoice: 'Professional' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    setError('');

    try {
      // 1. Call Amplify signUp
      await signUp({
        username: formData.email, // Since we set username_attributes = ["email"] in TF
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            'custom:brand_voice': formData.brandVoice,
          },
        }
      });
      
      // 2. Success! Move to confirmation screen
      navigate(`/confirm?email=${encodeURIComponent(formData.email)}`);

    } catch (err: any) {
      console.error("Signup Error:", err);
      setError(err.message || "Signup failed. Try a stronger password.");
    } finally {
      // Always stop loading, whether success or failure
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-blue-600">Join VinciFlow</h2>
          <p className="mt-2 text-gray-500">Start building your brand identity</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Work Email"
              className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirm"
                className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Initial Brand Voice</label>
              <select 
                className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, brandVoice: e.target.value})}
              >
                <option value="Professional">Professional & Clean</option>
                <option value="Witty">Witty & Humorous</option>
                <option value="Bold">Bold & Aggressive</option>
                <option value="Empathetic">Empathetic & Soft</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Free Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}