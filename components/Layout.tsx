import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { UserRole, AppView } from '../types';
import { LogOut, Bell, Activity, Stethoscope } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, currentRole, logout, notifications, markNotificationRead, navigate, currentView } = useHMS();
  const [showNotifications, setShowNotifications] = useState(false);

  const myNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Area */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(AppView.LANDING)}>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block tracking-tight">CarePlus</span>
            </div>

            <div className="flex items-center gap-4">
              
              {/* If User is Logged In (Patient or Doctor) */}
              {currentUser ? (
                <>
                  <span className="text-sm text-gray-600 hidden md:block">
                    Hello, <span className="font-semibold text-gray-900">{currentUser.name}</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wide">
                      {currentRole}
                    </span>
                  </span>

                  {/* Notifications */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors relative"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden z-50">
                        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <span className="text-xs text-gray-500">{unreadCount} unread</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {myNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications</div>
                          ) : (
                            myNotifications.map(notification => (
                              <div 
                                key={notification.id} 
                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${notification.read ? 'opacity-60' : 'bg-blue-50/50'}`}
                                onClick={() => markNotificationRead(notification.id)}
                              >
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                /* Guest View */
                <div className="flex items-center gap-3">
                  {currentView !== AppView.DOCTOR_LOGIN && (
                     <button
                        onClick={() => navigate(AppView.DOCTOR_LOGIN)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                     >
                        <Stethoscope className="w-4 h-4" />
                        Doctor Portal
                     </button>
                  )}
                  {currentView === AppView.LANDING && (
                      <button
                        onClick={() => navigate(AppView.PATIENT_DASHBOARD)}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                      >
                        Find a Doctor
                      </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
         <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
            © 2024 CarePlus Health. All rights reserved.
         </div>
      </footer>
    </div>
  );
};