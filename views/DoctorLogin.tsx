import React, { useState, useEffect } from 'react';
import { useHMS } from '../context/HMSContext';
import { Stethoscope, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const DoctorLogin: React.FC = () => {
  const { loginAsDoctor, doctors } = useHMS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Load cached email on mount
  useEffect(() => {
    const cachedEmail = localStorage.getItem('careplus_last_doctor_email');
    if (cachedEmail) {
      setEmail(cachedEmail);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulation logic: Find doctor by email and check hardcoded password
    const doctor = doctors.find(d => d.email.toLowerCase() === email.trim().toLowerCase());
    
    if (doctor && password === 'password') {
      // Cache the email for next time
      localStorage.setItem('careplus_last_doctor_email', email.trim());
      loginAsDoctor(doctor.id);
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-blue-600 p-8 text-center">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
                <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Doctor Portal</h1>
            <p className="text-blue-100 text-sm mt-2">Secure access for healthcare providers</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="email" 
                        name="email"
                        autoComplete="username email"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                        placeholder="doctor@careplus.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="password"
                        name="password"
                        autoComplete="current-password" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
                Sign In
                <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
                <p className="text-xs text-gray-400">
                    Demo: Try <span className="text-gray-600 font-mono font-medium">sarah@careplus.com</span> with password <span className="text-gray-600 font-mono font-medium">password</span>
                </p>
            </div>
        </form>
      </div>
    </div>
  );
};