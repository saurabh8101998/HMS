import React, { useState, useEffect } from 'react';
import { useHMS } from '../context/HMSContext';
import { AppView, UserRole } from '../types';
import { User, Stethoscope, ArrowRight, ArrowLeft, LogIn, UserPlus } from 'lucide-react';

export const Landing: React.FC = () => {
  const { navigate, currentUser, currentRole } = useHMS();
  const [mode, setMode] = useState<'none' | 'login' | 'register'>('none');

  // Automatically redirect logged-in users to their dashboard
  useEffect(() => {
    if (currentUser) {
      if (currentRole === UserRole.DOCTOR) {
        navigate(AppView.DOCTOR_DASHBOARD);
      } else {
        navigate(AppView.PATIENT_DASHBOARD);
      }
    }
  }, [currentUser, currentRole, navigate]);

  // If user is logged in, don't render the landing page content (prevents flash before redirect)
  if (currentUser) return null;

  const handleBack = () => setMode('none');

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh]">
      <div className="text-center max-w-3xl mx-auto px-4 w-full">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          Welcome to <span className="text-blue-600">CarePlus</span>
        </h1>
        <p className="text-lg text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
          Your health journey starts here. Connect with top specialists, manage appointments, and take control of your well-being.
        </p>

        <div className="max-w-md mx-auto min-h-[300px] flex items-center justify-center">
            <>
              {/* Main Selection: Login vs Register */}
              {mode === 'none' && (
                <div className="grid gap-4 w-full animate-in fade-in zoom-in-95 duration-300">
                  <button 
                    onClick={() => setMode('login')}
                    className="group relative p-6 bg-white border border-gray-200 hover:border-blue-400 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                        <LogIn className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Login</h3>
                        <p className="text-sm text-gray-500">Access your account</p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </button>

                  <button 
                    onClick={() => setMode('register')}
                    className="group relative p-6 bg-white border border-gray-200 hover:border-green-400 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-xl text-green-600">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Registration</h3>
                        <p className="text-sm text-gray-500">Create a new account</p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-green-600 transition-colors" />
                  </button>
                </div>
              )}

              {/* Role Selection: Patient vs Doctor */}
              {(mode === 'login' || mode === 'register') && (
                <div className="w-full animate-in slide-in-from-right duration-300">
                  <div className="flex items-center mb-6">
                     <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                     </button>
                     <h2 className="text-2xl font-bold text-gray-900">
                        {mode === 'login' ? 'Who are you?' : 'Join as a...'}
                     </h2>
                  </div>

                  <div className="grid gap-4">
                    <button 
                      onClick={() => navigate(mode === 'login' ? AppView.PATIENT_LOGIN : AppView.REGISTER_PATIENT)}
                      className="group p-5 bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl transition-all flex items-center gap-4"
                    >
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900">Patient</h3>
                        <p className="text-sm text-gray-500">{mode === 'login' ? 'Book appointments' : 'Find doctors & book'}</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => navigate(mode === 'login' ? AppView.DOCTOR_LOGIN : AppView.REGISTER_DOCTOR)}
                      className="group p-5 bg-white border border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 rounded-xl transition-all flex items-center gap-4"
                    >
                      <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900">Doctor</h3>
                        <p className="text-sm text-gray-500">{mode === 'login' ? 'Manage schedule' : 'Offer your services'}</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
        </div>
      </div>
    </div>
  );
};