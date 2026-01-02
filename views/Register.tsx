import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { AppView } from '../types';
import { User, Stethoscope, Mail, Lock, Building, ArrowRight, UserPlus } from 'lucide-react';

export const Register: React.FC = () => {
  const { currentView, registerPatient, registerDoctor } = useHMS();
  
  const isDoctor = currentView === AppView.REGISTER_DOCTOR;
  const roleName = isDoctor ? 'Doctor' : 'Patient';
  
  // Explicit styles to ensure Tailwind detects them
  const themeStyles = isDoctor ? {
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
    textLight: 'text-blue-100',
    shadow: 'shadow-blue-200',
    ring: 'focus:ring-blue-500'
  } : {
    bg: 'bg-green-600',
    bgHover: 'hover:bg-green-700',
    textLight: 'text-green-100',
    shadow: 'shadow-green-200',
    ring: 'focus:ring-green-500'
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    hospital: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDoctor) {
      if (!formData.specialty || !formData.hospital) {
        alert("Please fill in all doctor details");
        return;
      }
      registerDoctor(formData.name, formData.email, formData.specialty, formData.hospital);
    } else {
      registerPatient(formData.name, formData.email);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className={`${themeStyles.bg} p-8 text-center`}>
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
                {isDoctor ? <Stethoscope className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-white">{roleName} Registration</h1>
            <p className={`${themeStyles.textLight} text-sm mt-2`}>
                {isDoctor ? 'Join our network of healthcare professionals' : 'Create an account to manage your health'}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text"
                            name="name" 
                            required
                            className={`w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeStyles.ring} outline-none text-sm`}
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="email"
                            name="email" 
                            required
                            className={`w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeStyles.ring} outline-none text-sm`}
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="password"
                        name="password" 
                        required
                        className={`w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeStyles.ring} outline-none text-sm`}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {isDoctor && (
                <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
                    <p className="text-sm font-medium text-gray-900">Professional Details</p>
                     <div className="grid md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specialty</label>
                            <input 
                                type="text"
                                name="specialty" 
                                required
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeStyles.ring} outline-none text-sm`}
                                placeholder="e.g. Cardiologist"
                                value={formData.specialty}
                                onChange={handleChange}
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input 
                                    type="text"
                                    name="hospital" 
                                    required
                                    className={`w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeStyles.ring} outline-none text-sm`}
                                    placeholder="e.g. City Hospital"
                                    value={formData.hospital}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button 
                type="submit"
                className={`w-full py-3 ${themeStyles.bg} ${themeStyles.bgHover} text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg ${themeStyles.shadow} mt-4`}
            >
                Create Account
                <ArrowRight className="w-4 h-4" />
            </button>
        </form>
      </div>
    </div>
  );
};