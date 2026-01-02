import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Doctor, Patient, Appointment, AppointmentStatus, Notification, UserRole, AppView, WeeklySchedule } from '../types';
import { MOCK_DOCTORS, MOCK_PATIENT, INITIAL_APPOINTMENTS } from '../constants';

interface HMSContextType {
  currentUser: Patient | Doctor | null;
  currentRole: UserRole | null;
  currentView: AppView;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  notifications: Notification[];
  loginAsDoctor: (id: string) => void;
  loginAsPatient: (email: string) => boolean;
  registerPatient: (name: string, email: string) => void;
  registerDoctor: (name: string, email: string, specialty: string, hospital: string) => void;
  enterAsPatient: () => void;
  registerGuestPatient: (name: string, email: string) => Patient;
  createPatient: (name: string, email?: string) => Patient; // New method
  logout: () => void;
  navigate: (view: AppView) => void;
  bookAppointment: (doctorId: string, date: string, reason: string, patientId?: string) => void;
  rescheduleAppointment: (appointmentId: string, newDate: string) => void;
  cancelAppointment: (appointmentId: string) => void;
  updateDoctorSlots: (doctorId: string, newSlots: string[]) => void;
  checkScheduleConflicts: (doctorId: string, schedule: WeeklySchedule, startDateIso: string) => Appointment[];
  applyWeeklySchedule: (doctorId: string, schedule: WeeklySchedule, startDateIso: string, resolveConflicts: 'CANCEL' | 'KEEP') => void;
  addNotification: (message: string, userId: string) => void;
  markNotificationRead: (id: string) => void;
}

const HMSContext = createContext<HMSContextType | undefined>(undefined);

export const HMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<Patient | Doctor | null>(null);
  
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [patients, setPatients] = useState<Patient[]>([MOCK_PATIENT]); 
  
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const navigate = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const updateCurrentUserIfDoctor = useCallback((doctorId: string, updateFn: (doc: Doctor) => Doctor) => {
      setCurrentUser(prev => {
          if (prev && prev.id === doctorId && 'availableSlots' in prev) {
              return updateFn(prev as Doctor);
          }
          return prev;
      });
  }, []);

  const loginAsDoctor = (id: string) => {
    setDoctors(currentDoctors => {
        const doctor = currentDoctors.find(d => d.id === id);
        if (doctor) {
            setCurrentRole(UserRole.DOCTOR);
            setCurrentUser(doctor);
            setCurrentView(AppView.DOCTOR_DASHBOARD);
        }
        return currentDoctors;
    });
  };

  const loginAsPatient = (email: string): boolean => {
    const patient = patients.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (patient) {
      setCurrentRole(UserRole.PATIENT);
      setCurrentUser(patient);
      setCurrentView(AppView.PATIENT_DASHBOARD);
      return true;
    }
    return false;
  };

  const registerPatient = (name: string, email: string) => {
    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email
    };
    setPatients(prev => [...prev, newPatient]);
    setCurrentUser(newPatient);
    setCurrentRole(UserRole.PATIENT);
    setCurrentView(AppView.PATIENT_DASHBOARD);
    addNotification("Welcome to CarePlus! Your account has been created.", newPatient.id);
  };

  const registerDoctor = (name: string, email: string, specialty: string, hospital: string) => {
    const newDoctor: Doctor = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Dr. ${name}`,
      email,
      specialty,
      hospital,
      bio: 'New specialist joining CarePlus.',
      imageUrl: `https://ui-avatars.com/api/?name=${name}&background=random`,
      availableSlots: [] 
    };
    setDoctors(prev => [...prev, newDoctor]);
    setCurrentUser(newDoctor);
    setCurrentRole(UserRole.DOCTOR);
    setCurrentView(AppView.DOCTOR_DASHBOARD);
    addNotification("Welcome Doctor! Please set up your availability slots.", newDoctor.id);
  };

  const enterAsPatient = () => setCurrentView(AppView.PATIENT_DASHBOARD);

  const registerGuestPatient = (name: string, email: string): Patient => {
    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email
    };
    setPatients(prev => [...prev, newPatient]);
    setCurrentUser(newPatient);
    setCurrentRole(UserRole.PATIENT);
    return newPatient;
  };

  const createPatient = (name: string, email: string = ''): Patient => {
    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email: email || `guest_${Math.random().toString(36).substr(2, 5)}@careplus.local`
    };
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  const logout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
    setCurrentView(AppView.LANDING);
  };

  const addNotification = (message: string, userId: string) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const bookAppointment = (doctorId: string, date: string, reason: string, explicitPatientId?: string) => {
    const pId = explicitPatientId || (currentUser ? currentUser.id : null);
    if (!pId) return;

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      doctorId,
      patientId: pId,
      date,
      status: AppointmentStatus.SCHEDULED,
      type: 'Consultation',
      reason
    };

    setAppointments(prev => [...prev, newAppointment]);

    setDoctors(prev => prev.map(doc => 
      doc.id === doctorId ? { ...doc, availableSlots: doc.availableSlots.filter(s => s !== date) } : doc
    ));

    updateCurrentUserIfDoctor(doctorId, (doc) => ({
        ...doc,
        availableSlots: doc.availableSlots.filter(s => s !== date)
    }));

    addNotification(`Appointment confirmed for ${new Date(date).toLocaleString()}`, pId);
    addNotification(`New appointment booked by patient.`, doctorId);
  };

  const rescheduleAppointment = (appointmentId: string, newDate: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const oldDate = appointment.date;
    const doctorId = appointment.doctorId;

    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, date: newDate, status: AppointmentStatus.RESCHEDULED } : a
    ));

    setDoctors(prev => prev.map(doc => {
      if (doc.id === doctorId) {
        const updatedSlots = [...doc.availableSlots, oldDate].filter(s => s !== newDate);
        return { ...doc, availableSlots: updatedSlots.sort() };
      }
      return doc;
    }));

    updateCurrentUserIfDoctor(doctorId, (doc) => {
        const updatedSlots = [...doc.availableSlots, oldDate].filter(s => s !== newDate);
        return { ...doc, availableSlots: updatedSlots.sort() };
    });

    if (currentUser) addNotification(`Appointment rescheduled to ${new Date(newDate).toLocaleString()}`, currentUser.id);
  };

  const cancelAppointment = (appointmentId: string) => {
      const appointment = appointments.find(a => a.id === appointmentId);
      if(!appointment) return;

      setAppointments(prev => prev.map(a => 
          a.id === appointmentId ? { ...a, status: AppointmentStatus.CANCELLED } : a
      ));

      // Note: We do NOT add the slot back to availableSlots.
      // This leaves the slot as "unavailable" (neither booked nor available), 
      // allowing the doctor to decide whether to re-open it.

      if(currentUser) addNotification("Appointment cancelled", currentUser.id);
  };

  const updateDoctorSlots = (doctorId: string, newSlots: string[]) => {
      setDoctors(prev => prev.map(d => d.id === doctorId ? {...d, availableSlots: newSlots} : d));
      updateCurrentUserIfDoctor(doctorId, (doc) => ({
          ...doc,
          availableSlots: newSlots
      }));
  };

  // Helper to generate slots for a range
  const generateSlotsForRange = (schedule: WeeklySchedule, startDate: Date, days: number = 7): string[] => {
      const generatedSlots: string[] = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (let i = 0; i < days; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          // Safety: ensure we don't accidentally get partial times if startDate had them
          d.setMinutes(0, 0, 0); 

          const dayName = dayNames[d.getDay()] as keyof WeeklySchedule;
          const allowedHours = schedule[dayName] || [];

          allowedHours.forEach(hour => {
              const slotTime = new Date(d);
              slotTime.setHours(hour, 0, 0, 0);
              generatedSlots.push(slotTime.toISOString());
          });
      }
      return generatedSlots;
  };

  const checkScheduleConflicts = (doctorId: string, schedule: WeeklySchedule, startDateIso: string): Appointment[] => {
      const startDate = new Date(startDateIso);
      startDate.setMinutes(0,0,0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7); // Checking 7 days out

      // 1. Generate all ALLOWED slots for this period
      const allowedSlots = generateSlotsForRange(schedule, startDate, 7);
      const allowedSet = new Set(allowedSlots);

      // 2. Find existing appointments in this range
      const existingAppointments = appointments.filter(a => {
          if (a.doctorId !== doctorId || a.status === AppointmentStatus.CANCELLED) return false;
          const apptDate = new Date(a.date);
          return apptDate >= startDate && apptDate < endDate;
      });

      // 3. Identify conflicts (Appointment exists at a time that is NOT in allowedSlots)
      const conflicts = existingAppointments.filter(appt => !allowedSet.has(appt.date));
      return conflicts;
  };

  const applyWeeklySchedule = (doctorId: string, schedule: WeeklySchedule, startDateIso: string, resolveConflicts: 'CANCEL' | 'KEEP') => {
      const startDate = new Date(startDateIso);
      startDate.setMinutes(0,0,0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const conflicts = checkScheduleConflicts(doctorId, schedule, startDateIso);

      // 1. Handle Conflicts
      if (resolveConflicts === 'CANCEL' && conflicts.length > 0) {
          const conflictIds = new Set(conflicts.map(c => c.id));
          setAppointments(prev => prev.map(a => 
              conflictIds.has(a.id) ? { ...a, status: AppointmentStatus.CANCELLED } : a
          ));
          conflicts.forEach(c => {
             addNotification(`Appointment on ${new Date(c.date).toLocaleString()} cancelled due to schedule change.`, c.patientId);
          });
          addNotification(`${conflicts.length} conflicting appointments cancelled.`, doctorId);
      }
      // If 'KEEP', we do nothing to the appointments, they stay as SCHEDULED.

      // 2. Update Available Slots
      // We need to:
      // a) Remove existing 'availableSlots' that fall within the start-end range
      // b) Add new generated slots that are NOT booked (unless we cancelled them, then they are open)
      
      setDoctors(prevDocs => {
          return prevDocs.map(doc => {
            if (doc.id !== doctorId) return doc;

            const newAllowedSlots = generateSlotsForRange(schedule, startDate, 7);
            
            // Filter out slots that are outside the target range (keep them)
            const keptSlots = doc.availableSlots.filter(s => {
                const d = new Date(s);
                return d < startDate || d >= endDate;
            });

            // Calculate which of the newAllowedSlots are actually available
            // If we KEPPT appointments, those times are NOT available.
            // If we CANCELLED appointments, those times ARE available.
            
            // Get current active appointments (re-fetch logic since state might not have flushed if we just called setAppointments)
            // But we can use the 'conflicts' array and 'resolveConflicts' logic
            const activeApptsInWindow = appointments.filter(a => {
                if (a.doctorId !== doctorId || a.status === AppointmentStatus.CANCELLED) return false;
                const d = new Date(a.date);
                // If we are cancelling conflicts, filter them out of "active" list logic effectively
                if (resolveConflicts === 'CANCEL' && conflicts.some(c => c.id === a.id)) return false;
                return d >= startDate && d < endDate;
            }).map(a => a.date);

            const finalNewSlots = newAllowedSlots.filter(s => !activeApptsInWindow.includes(s));

            // Merge
            const merged = [...keptSlots, ...finalNewSlots].sort();
            
            // Sync with current user state immediately for UI response
            if (currentUser && currentUser.id === doctorId) {
                // This is a side effect inside a reducer-like map, but safe in this context
                setTimeout(() => {
                    updateCurrentUserIfDoctor(doctorId, d => ({ ...d, availableSlots: merged, defaultSchedule: schedule }));
                }, 0);
            }

            return {
                ...doc,
                availableSlots: merged,
                defaultSchedule: schedule
            };
          });
      });
      
      if (resolveConflicts === 'KEEP') {
        addNotification("Schedule updated. Conflicting appointments were retained.", doctorId);
      }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <HMSContext.Provider value={{
      currentUser,
      currentRole,
      currentView,
      doctors,
      patients,
      appointments,
      notifications,
      loginAsDoctor,
      loginAsPatient,
      enterAsPatient,
      registerPatient,
      registerDoctor,
      registerGuestPatient,
      createPatient,
      logout,
      navigate,
      bookAppointment,
      rescheduleAppointment,
      cancelAppointment,
      updateDoctorSlots,
      checkScheduleConflicts,
      applyWeeklySchedule,
      addNotification,
      markNotificationRead
    }}>
      {children}
    </HMSContext.Provider>
  );
};

export const useHMS = () => {
  const context = useContext(HMSContext);
  if (!context) {
    throw new Error('useHMS must be used within a HMSProvider');
  }
  return context;
};