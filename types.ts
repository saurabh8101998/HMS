export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN' // Reserved for future
}

export enum AppView {
  LANDING = 'LANDING',
  PATIENT_DASHBOARD = 'PATIENT_DASHBOARD',
  DOCTOR_LOGIN = 'DOCTOR_LOGIN',
  PATIENT_LOGIN = 'PATIENT_LOGIN',
  REGISTER_PATIENT = 'REGISTER_PATIENT',
  REGISTER_DOCTOR = 'REGISTER_DOCTOR',
  DOCTOR_DASHBOARD = 'DOCTOR_DASHBOARD'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export type WeeklySchedule = {
  [key in 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday']: number[];
};

export interface Doctor {
  id: string;
  name: string;
  email: string; 
  specialty: string;
  hospital: string;
  bio: string;
  imageUrl: string;
  availableSlots: string[]; // ISO date strings
  defaultSchedule?: WeeklySchedule; // Persisted preference for weekly hours
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  // Demographics
  dateOfBirth?: string; // ISO date string YYYY-MM-DD
  gender?: 'Male' | 'Female' | 'Other';
  phone?: string;
  bloodGroup?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string; // ISO date string
  status: AppointmentStatus;
  type: string; // e.g., "Checkup", "Consultation"
  reason?: string;
  // Clinical Data
  diagnosis?: string;
  prescription?: string;
  notes?: string; // Internal doctor notes
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  read: boolean;
}