import { Doctor, Patient, Appointment, AppointmentStatus } from './types';

// Helper to generate future dates
const getFutureDate = (days: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Bennett',
    email: 'sarah@careplus.com',
    specialty: 'Cardiologist',
    hospital: 'City General Hospital',
    bio: 'Expert in cardiovascular health with 15 years of experience.',
    imageUrl: 'https://picsum.photos/200/200?random=1',
    availableSlots: [
      getFutureDate(1, 9),
      getFutureDate(1, 10),
      getFutureDate(1, 14),
      getFutureDate(2, 11),
      getFutureDate(3, 9),
    ]
  },
  {
    id: 'd2',
    name: 'Dr. James Wilson',
    email: 'james@careplus.com',
    specialty: 'Dermatologist',
    hospital: 'Skin & Care Clinic',
    bio: 'Specializing in advanced dermatological treatments and cosmetic procedures.',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    availableSlots: [
      getFutureDate(1, 11),
      getFutureDate(2, 15),
      getFutureDate(2, 16),
      getFutureDate(4, 10),
    ]
  },
  {
    id: 'd3',
    name: 'Dr. Emily Chen',
    email: 'emily@careplus.com',
    specialty: 'Pediatrician',
    hospital: 'City General Hospital',
    bio: 'Compassionate care for children from infancy through adolescence.',
    imageUrl: 'https://picsum.photos/200/200?random=3',
    availableSlots: [
      getFutureDate(1, 8),
      getFutureDate(1, 13),
      getFutureDate(3, 10),
      getFutureDate(3, 11),
    ]
  },
  {
    id: 'd4',
    name: 'Dr. Michael Ross',
    email: 'michael@careplus.com',
    specialty: 'General Practitioner',
    hospital: 'Community Health Center',
    bio: 'Your primary partner in health and wellness.',
    imageUrl: 'https://picsum.photos/200/200?random=4',
    availableSlots: [
      getFutureDate(0, 14), // Today
      getFutureDate(1, 9),
      getFutureDate(2, 9),
    ]
  },
    {
    id: 'd5',
    name: 'Dr. Olivia Martinez',
    email: 'olivia@careplus.com',
    specialty: 'Neurologist',
    hospital: 'Neuro Institute',
    bio: 'Specialist in treating disorders of the nervous system.',
    imageUrl: 'https://picsum.photos/200/200?random=5',
    availableSlots: [
      getFutureDate(5, 10),
      getFutureDate(6, 11),
    ]
  }
];

export const MOCK_PATIENT: Patient = {
  id: 'p1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  dateOfBirth: '1985-04-12',
  gender: 'Male',
  phone: '+1 (555) 012-3456',
  bloodGroup: 'O+'
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    doctorId: 'd1',
    patientId: 'p1',
    date: getFutureDate(-30, 10), // Past appointment 1 month ago
    status: AppointmentStatus.COMPLETED,
    type: 'Checkup',
    reason: 'Regular heart checkup',
    diagnosis: 'Mild Hypertension',
    prescription: 'Lisinopril 10mg daily',
    notes: 'Patient advised to reduce sodium intake and increase cardio exercise.'
  },
  {
    id: 'a2',
    doctorId: 'd4',
    patientId: 'p1',
    date: getFutureDate(-60, 14), // Past appointment 2 months ago
    status: AppointmentStatus.COMPLETED,
    type: 'Consultation',
    reason: 'Flu symptoms',
    diagnosis: 'Seasonal Influenza',
    prescription: 'Rest, fluids, Ibuprofen',
    notes: 'Recovered fully after 5 days.'
  }
];

export const SPECIALTIES = [
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Neurologist',
  'Orthopedist'
];