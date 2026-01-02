import React from 'react';
import { HMSProvider, useHMS } from './context/HMSContext';
import { Layout } from './components/Layout';
import { Landing } from './views/Landing';
import { PatientView } from './views/PatientView';
import { DoctorView } from './views/DoctorView';
import { DoctorLogin } from './views/DoctorLogin';
import { PatientLogin } from './views/PatientLogin';
import { Register } from './views/Register';
import { AppView } from './types';

const AppContent: React.FC = () => {
  const { currentView } = useHMS();

  return (
    <Layout>
      {currentView === AppView.LANDING && <Landing />}
      {currentView === AppView.PATIENT_DASHBOARD && <PatientView />}
      
      {currentView === AppView.DOCTOR_LOGIN && <DoctorLogin />}
      {currentView === AppView.PATIENT_LOGIN && <PatientLogin />}
      
      {(currentView === AppView.REGISTER_PATIENT || currentView === AppView.REGISTER_DOCTOR) && <Register />}
      
      {currentView === AppView.DOCTOR_DASHBOARD && <DoctorView />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HMSProvider>
      <AppContent />
    </HMSProvider>
  );
};

export default App;