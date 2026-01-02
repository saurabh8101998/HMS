import React, { useState, useMemo, useEffect } from 'react';
import { useHMS } from '../context/HMSContext';
import { AppointmentStatus, Doctor, WeeklySchedule, Appointment, Patient } from '../types';
import { Calendar, Clock, User, CheckCircle, XCircle, Trash2, Settings, Save, X, AlertTriangle, ArrowRight, Info, PlusCircle, Edit, Check, FileText, Activity, Phone, Clipboard, Pill, Stethoscope } from 'lucide-react';

export const DoctorView: React.FC = () => {
  const { currentUser, appointments, patients, doctors, cancelAppointment, completeAppointment, updateDoctorSlots, checkScheduleConflicts, applyWeeklySchedule, bookAppointment, createPatient } = useHMS();
  const [activeTab, setActiveTab] = useState<'schedule' | 'manage'>('schedule');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'availability' | 'booking'>('availability');
  
  // Ad-hoc Booking State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [adHocPatientName, setAdHocPatientName] = useState('');
  const [adHocReason, setAdHocReason] = useState('');

  // Appointment Details / Cancellation Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultationData, setConsultationData] = useState({ diagnosis: '', prescription: '', notes: '' });
  
  // Weekly Schedule State
  const [weeklyConfig, setWeeklyConfig] = useState<WeeklySchedule>({
    Monday: [9, 10, 11, 13, 14, 15, 16],
    Tuesday: [9, 10, 11, 13, 14, 15, 16],
    Wednesday: [9, 10, 11, 13, 14, 15, 16],
    Thursday: [9, 10, 11, 13, 14, 15, 16],
    Friday: [9, 10, 11, 13, 14, 15, 16],
    Saturday: [10, 11, 12, 13],
    Sunday: []
  });

  // Start Date for Schedule Application
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [identifiedConflicts, setIdentifiedConflicts] = useState<Appointment[]>([]);
  // Store resolutions: 'KEEP' means retain appointment (conflict), 'CANCEL' means delete appointment
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'KEEP' | 'CANCEL'>>({});

  // Ensure we are viewing a doctor
  if (!currentUser || !('specialty' in currentUser)) return null;
  
  // Safe cast
  const currentDoctor = currentUser as Doctor;
  const availableSlots = currentDoctor.availableSlots || [];

  // Initialize start date to tomorrow
  useEffect(() => {
    if (showConfigModal && !scheduleStartDate) {
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        setScheduleStartDate(tmr.toISOString().split('T')[0]);
    }
  }, [showConfigModal]);

  // Sync state with doctor's saved preference
  useEffect(() => {
    if (currentDoctor.defaultSchedule) {
      setWeeklyConfig(currentDoctor.defaultSchedule);
    }
  }, [currentDoctor.defaultSchedule]);

  // Reset consultation form when appointment changes
  useEffect(() => {
    if(selectedAppointment) {
      setConsultationData({
        diagnosis: selectedAppointment.diagnosis || '',
        prescription: selectedAppointment.prescription || '',
        notes: selectedAppointment.notes || ''
      });
    }
  }, [selectedAppointment]);

  const myAppointments = appointments
    .filter(a => a.doctorId === currentDoctor.id && a.status !== AppointmentStatus.CANCELLED)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const potentialSlots = useMemo(() => {
    const slots = [];
    const today = new Date();
    today.setMinutes(0, 0, 0); 
    
    for(let i=0; i<7; i++) { 
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
        hours.forEach(h => {
            d.setHours(h, 0, 0, 0);
            slots.push(d.toISOString());
        });
    }
    return slots;
  }, []); 
  
  const toggleSlot = (slot: string) => {
      const isAvailable = availableSlots.includes(slot);
      let newSlots;
      if (isAvailable) {
          newSlots = availableSlots.filter(s => s !== slot);
      } else {
          newSlots = [...availableSlots, slot].sort();
      }
      updateDoctorSlots(currentDoctor.id, newSlots);
  };
  
  const handleSlotClick = (slot: string, appointment?: Appointment) => {
      // If there's an existing appointment, open details modal
      if (appointment) {
          setSelectedAppointment(appointment);
          return;
      }

      // Interaction depends on mode
      if (interactionMode === 'booking') {
          setBookingSlot(slot);
          setAdHocPatientName('');
          setAdHocReason('');
          setShowBookingModal(true);
      } else {
          toggleSlot(slot);
      }
  };

  const handleAdHocBooking = () => {
    if (!bookingSlot || !adHocPatientName.trim()) return;

    // Create a new patient record implicitly
    const newPatient = createPatient(adHocPatientName.trim());
    
    // Book the appointment
    bookAppointment(currentDoctor.id, bookingSlot, adHocReason || 'Ad-hoc Consultation', newPatient.id);
    
    setShowBookingModal(false);
    setBookingSlot(null);
  };

  const handleCancelAppointment = () => {
      if (selectedAppointment) {
          if (confirm("Are you sure you want to cancel this appointment?")) {
            cancelAppointment(selectedAppointment.id);
            setSelectedAppointment(null);
          }
      }
  };

  const handleCompleteConsultation = () => {
    if (selectedAppointment) {
      completeAppointment(
        selectedAppointment.id, 
        consultationData.diagnosis, 
        consultationData.prescription, 
        consultationData.notes
      );
      setSelectedAppointment(null);
    }
  };

  const clearAllSlots = () => {
      if (confirm("Clear all available slots?")) {
          updateDoctorSlots(currentDoctor.id, []);
      }
  };

  const handlePreviewSchedule = () => {
    if (!scheduleStartDate) return;
    
    // Check conflicts
    const conflicts = checkScheduleConflicts(currentDoctor.id, weeklyConfig, scheduleStartDate);
    
    if (conflicts.length > 0) {
        setIdentifiedConflicts(conflicts);
        // Default to keeping all
        const initialResolutions = conflicts.reduce<Record<string, 'KEEP' | 'CANCEL'>>((acc, c) => ({...acc, [c.id]: 'KEEP'}), {});
        setConflictResolutions(initialResolutions);
        setShowConflictModal(true);
    } else {
        // No conflicts, apply directly with empty cancel list
        applyWeeklySchedule(currentDoctor.id, weeklyConfig, scheduleStartDate, []);
        setShowConfigModal(false);
    }
  };

  const handleApplyResolutions = () => {
      const idsToCancel = Object.entries(conflictResolutions)
        .filter(([_, action]) => action === 'CANCEL')
        .map(([id]) => id);
        
      applyWeeklySchedule(currentDoctor.id, weeklyConfig, scheduleStartDate, idsToCancel);
      setShowConflictModal(false);
      setShowConfigModal(false);
  };

  const toggleWeeklyHour = (day: keyof WeeklySchedule, hour: number) => {
    setWeeklyConfig(prev => {
      const currentHours = prev[day] || [];
      const newHours = currentHours.includes(hour)
        ? currentHours.filter(h => h !== hour)
        : [...currentHours, hour].sort((a, b) => a - b);
      return { ...prev, [day]: newHours };
    });
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A';
    const today = new Date();
    const dob = new Date(dobString);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
  };

  const slotsByDate = useMemo(() => {
      return potentialSlots.reduce((acc, slot) => {
        const dateKey = formatDate(slot);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
      }, {} as Record<string, string[]>);
  }, [potentialSlots]);

  const weekDays: (keyof WeeklySchedule)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const configHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6">
          <img src={currentDoctor.imageUrl} className="w-20 h-20 rounded-full object-cover border-4 border-blue-50" />
          <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{currentDoctor.name}</h2>
              <p className="text-gray-500">{currentDoctor.specialty} • {currentDoctor.hospital}</p>
          </div>
          <div className="flex gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{myAppointments.length}</div>
                  <div className="text-xs text-blue-800 font-medium uppercase tracking-wide">Upcoming</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{availableSlots.length}</div>
                  <div className="text-xs text-green-800 font-medium uppercase tracking-wide">Open Slots</div>
              </div>
          </div>
       </div>

       <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          My Schedule
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'manage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Manage Slots
        </button>
      </div>

      {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Next 7 Days</span>
              </div>
              {myAppointments.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming appointments scheduled.</p>
                  </div>
              ) : (
                  <div className="divide-y divide-gray-100">
                      {myAppointments.map(appt => (
                          <div key={appt.id} onClick={() => setSelectedAppointment(appt)} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4 cursor-pointer group">
                              <div className="flex items-start sm:items-center gap-4">
                                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                      <User className="h-6 w-6" />
                                  </div>
                                  <div>
                                      <h4 className="font-medium text-gray-900">
                                        {patients.find(p => p.id === appt.patientId)?.name || 'Guest Patient'}
                                      </h4>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(appt.date)}</span>
                                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(appt.date)}</span>
                                      </div>
                                      {appt.reason && (
                                        <p className="text-sm text-gray-600 mt-2 bg-gray-100 inline-block px-2 py-1 rounded">
                                            Reason: {appt.reason}
                                        </p>
                                      )}
                                  </div>
                              </div>
                              <div className="flex gap-2 self-end sm:self-center">
                                  <button 
                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                                  >
                                      View Records
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {activeTab === 'manage' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* ... existing manage slots UI ... */}
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 border border-blue-100">
                  <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                          <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                          <h4 className="font-semibold text-blue-900">Availability Manager</h4>
                          <p className="text-sm text-blue-700">Manage slots or book ad-hoc appointments</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                      {/* Interaction Mode Toggle */}
                      <div className="bg-white/50 p-1 rounded-xl border border-blue-200 flex sm:w-auto w-full">
                          <button
                            onClick={() => setInteractionMode('availability')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${interactionMode === 'availability' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-900'}`}
                          >
                             <Edit className="w-4 h-4" />
                             Manage Slots
                          </button>
                          <button
                            onClick={() => setInteractionMode('booking')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${interactionMode === 'booking' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-900/60 hover:text-blue-900'}`}
                          >
                             <PlusCircle className="w-4 h-4" />
                             Ad-hoc Booking
                          </button>
                      </div>

                      <div className="flex gap-2">
                        <button 
                            onClick={() => setShowConfigModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-200 text-sm font-medium rounded-xl hover:bg-blue-50 transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            Weekly Schedule
                        </button>
                        <button 
                            onClick={clearAllSlots}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-50 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
              </div>

              {/* Grid Legend */}
               {interactionMode === 'booking' && (
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                      Booking Mode Active: Click any empty slot to book an appointment immediately.
                  </div>
              )}

              <div className="grid gap-6">
                {(Object.entries(slotsByDate) as [string, string[]][]).map(([date, slots]) => {
                    const isWeekend = date.startsWith('Sat') || date.startsWith('Sun');
                    return (
                        <div key={date} className={`bg-white p-5 rounded-2xl border ${isWeekend ? 'border-orange-100 bg-orange-50/30' : 'border-gray-100'} shadow-sm`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className={`w-5 h-5 ${isWeekend ? 'text-orange-400' : 'text-gray-400'}`} />
                                    <h4 className={`font-bold ${isWeekend ? 'text-orange-800' : 'text-gray-800'}`}>{date}</h4>
                                </div>
                                {isWeekend && <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide bg-orange-100 px-2 py-1 rounded-full">Weekend</span>}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2">
                                {slots.map((slot, idx) => {
                                    const isAvailable = availableSlots.includes(slot);
                                    // Check if actually booked (conflicts)
                                    const appointment = appointments.find(a => a.doctorId === currentDoctor.id && a.date === slot && a.status !== AppointmentStatus.CANCELLED);
                                    const isBooked = !!appointment;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSlotClick(slot, appointment)}
                                            className={`
                                                relative px-2 py-3 rounded-lg text-sm font-medium transition-all duration-200 border group
                                                ${isBooked 
                                                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700 cursor-pointer shadow-sm' 
                                                    : interactionMode === 'booking'
                                                        ? 'hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md cursor-cell ' + (isAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500')
                                                        : isAvailable 
                                                            ? 'bg-green-600 border-green-600 text-white shadow-md shadow-green-200 transform scale-105' 
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            {formatTime(slot)}
                                            
                                            {/* Status Dot for Booked */}
                                            {isBooked && (
                                                <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            )}

                                            {/* Tooltip for Booked Slots - Now just info, since click opens modal */}
                                            {isBooked && appointment && (
                                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-max max-w-[220px] pb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-left pointer-events-none">
                                                    <div className="relative p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700">
                                                        <span className="font-semibold text-indigo-200">Reserved</span>
                                                        <div className="border-t border-gray-700 mt-1 pt-1 opacity-75">Click for details</div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                 </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
              </div>
          </div>
      )}

      {/* Appointment Details & History Modal (Expanded EMR View) */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row">
              
              {/* Left Panel: Patient Profile & History */}
              <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
                 <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
                            {(() => {
                                const p = patients.find(p => p.id === selectedAppointment.patientId);
                                return p ? p.name.charAt(0) : 'G';
                            })()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                                {patients.find(p => p.id === selectedAppointment.patientId)?.name || 'Guest Patient'}
                            </h3>
                            <p className="text-xs text-gray-500">Patient ID: {selectedAppointment.patientId}</p>
                        </div>
                    </div>
                    
                    {/* Patient Details */}
                    {(() => {
                        const p = patients.find(p => p.id === selectedAppointment.patientId);
                        if(p) return (
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                    <span>{calculateAge(p.dateOfBirth)} yrs • {p.gender || 'Unknown'} • {p.bloodGroup || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{p.phone || 'No phone number'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>DOB: {p.dateOfBirth || 'N/A'}</span>
                                </div>
                            </div>
                        );
                        return <p className="mt-4 text-sm text-gray-500 italic">Guest patient details unavailable.</p>;
                    })()}
                 </div>

                 {/* History Timeline */}
                 <div className="flex-grow overflow-y-auto p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 pl-2">Patient History</h4>
                    <div className="space-y-4">
                        {appointments
                            .filter(a => a.patientId === selectedAppointment.patientId && new Date(a.date) < new Date(selectedAppointment.date) && a.status === AppointmentStatus.COMPLETED)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(historyAppt => (
                                <div key={historyAppt.id} className="pl-4 border-l-2 border-gray-200 relative pb-2">
                                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                    <p className="text-xs text-gray-500 mb-1">{formatDate(historyAppt.date)}</p>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                        <p className="font-semibold text-gray-800 text-sm">{historyAppt.type}</p>
                                        <p className="text-xs text-gray-500 mb-2">Dr. {doctors.find(d => d.id === historyAppt.doctorId)?.name}</p>
                                        {historyAppt.diagnosis && (
                                            <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded mb-1">
                                                <strong>Dx:</strong> {historyAppt.diagnosis}
                                            </div>
                                        )}
                                        {historyAppt.notes && (
                                            <p className="text-xs text-gray-600 italic">"{historyAppt.notes}"</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        }
                        {appointments.filter(a => a.patientId === selectedAppointment.patientId && new Date(a.date) < new Date(selectedAppointment.date) && a.status === AppointmentStatus.COMPLETED).length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-8">No prior history found.</div>
                        )}
                    </div>
                 </div>
              </div>

              {/* Right Panel: Current Encounter */}
              <div className="w-full md:w-2/3 flex flex-col h-full">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                      <div>
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">
                            {selectedAppointment.status}
                          </span>
                          <h2 className="text-xl font-bold text-gray-900 mt-1">Consultation</h2>
                          <p className="text-sm text-gray-500">{formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.date)}</p>
                      </div>
                      <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-white">
                      {/* Reason */}
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                          <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">Reason for Visit</h4>
                          <p className="text-lg text-gray-800 font-medium">"{selectedAppointment.reason}"</p>
                      </div>

                      {/* Doctor Inputs */}
                      <div className="grid gap-6">
                           <div className="space-y-2">
                               <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                   <Stethoscope className="w-4 h-4 text-blue-500" />
                                   Clinical Diagnosis
                               </label>
                               <input 
                                   type="text" 
                                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                   placeholder="e.g. Acute Bronchitis"
                                   value={consultationData.diagnosis}
                                   onChange={(e) => setConsultationData({...consultationData, diagnosis: e.target.value})}
                                   disabled={selectedAppointment.status === AppointmentStatus.COMPLETED}
                               />
                           </div>

                           <div className="space-y-2">
                               <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                   <Pill className="w-4 h-4 text-green-500" />
                                   Prescription / Plan
                               </label>
                               <textarea 
                                   rows={3}
                                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                                   placeholder="e.g. Amoxicillin 500mg TDS x 5 days"
                                   value={consultationData.prescription}
                                   onChange={(e) => setConsultationData({...consultationData, prescription: e.target.value})}
                                   disabled={selectedAppointment.status === AppointmentStatus.COMPLETED}
                               />
                           </div>

                           <div className="space-y-2">
                               <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                   <FileText className="w-4 h-4 text-gray-400" />
                                   Internal Notes (Private)
                               </label>
                               <textarea 
                                   rows={3}
                                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none bg-gray-50"
                                   placeholder="Observations, differentials, etc."
                                   value={consultationData.notes}
                                   onChange={(e) => setConsultationData({...consultationData, notes: e.target.value})}
                                   disabled={selectedAppointment.status === AppointmentStatus.COMPLETED}
                               />
                           </div>
                      </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                      {selectedAppointment.status !== AppointmentStatus.COMPLETED ? (
                         <>
                            <button 
                                onClick={handleCancelAppointment}
                                className="text-red-600 font-medium text-sm hover:underline"
                            >
                                Cancel Appointment
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setSelectedAppointment(null)}
                                    className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={handleCompleteConsultation}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Complete Consultation
                                </button>
                            </div>
                         </>
                      ) : (
                          <div className="w-full flex justify-between items-center">
                              <span className="flex items-center gap-2 text-green-700 font-bold">
                                  <CheckCircle className="w-5 h-5" />
                                  Consultation Completed
                              </span>
                              <button 
                                    onClick={() => setSelectedAppointment(null)}
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Close Record
                                </button>
                          </div>
                      )}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Weekly Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
             {/* ... existing config modal content ... */}
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Default Weekly Schedule
                    </h3>
                    <p className="text-sm text-gray-500">Configure your standard hours and apply them to a specific week.</p>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                    <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto space-y-6">
                 {/* Start Date Selector */}
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center gap-4">
                     <div className="flex-grow">
                         <label className="block text-sm font-bold text-blue-900 mb-1">Apply Schedule Starting From:</label>
                         <p className="text-xs text-blue-700">The schedule will generate slots for 7 days starting from this date.</p>
                     </div>
                     <input 
                        type="date" 
                        value={scheduleStartDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setScheduleStartDate(e.target.value)}
                        className="px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                     />
                 </div>

                 <div className="space-y-4">
                    {weekDays.map(day => {
                        const isWeekend = day === 'Saturday' || day === 'Sunday';
                        return (
                            <div key={day} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border ${isWeekend ? 'bg-orange-50/30 border-orange-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                <div className="w-32 font-semibold text-gray-700">{day}</div>
                                <div className="flex flex-wrap gap-2 flex-grow">
                                    {configHours.map(hour => {
                                        const isSelected = weeklyConfig[day]?.includes(hour);
                                        return (
                                            <button
                                                key={hour}
                                                onClick={() => toggleWeeklyHour(day, hour)}
                                                className={`
                                                    w-16 py-2 rounded-lg text-xs font-semibold border transition-all
                                                    ${isSelected 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                                                    }
                                                `}
                                            >
                                                {hour}:00
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                 </div>
             </div>

             <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                 <button 
                    onClick={() => setShowConfigModal(false)}
                    className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handlePreviewSchedule}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Save & Apply
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Ad-Hoc Booking Modal */}
      {showBookingModal && bookingSlot && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 bg-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Book Appointment
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                        {formatDate(bookingSlot)} at {formatTime(bookingSlot)}
                    </p>
                </div>
                
                <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Patient Name</label>
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="e.g. John Doe"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            value={adHocPatientName}
                            onChange={(e) => setAdHocPatientName(e.target.value)}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reason / Notes</label>
                        <textarea 
                            rows={3}
                            placeholder="e.g. Regular Checkup"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                            value={adHocReason}
                            onChange={(e) => setAdHocReason(e.target.value)}
                        />
                     </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={() => { setShowBookingModal(false); setBookingSlot(null); }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleAdHocBooking}
                        disabled={!adHocPatientName.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Booking
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="p-6 bg-amber-50 border-b border-amber-100 shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Schedule Conflicts Detected</h3>
                    </div>
                    <p className="text-sm text-amber-800">
                        The new schedule conflicts with <strong>{identifiedConflicts.length} existing appointments</strong>. 
                        Please decide whether to keep or cancel each appointment.
                    </p>
                </div>
                
                <div className="bg-white border-b border-gray-100 px-6 py-3 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={() => {
                            const allKeep = identifiedConflicts.reduce<Record<string, 'KEEP' | 'CANCEL'>>((acc, c) => ({...acc, [c.id]: 'KEEP'}), {});
                            setConflictResolutions(allKeep);
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        Set all to Keep
                    </button>
                    <button 
                         onClick={() => {
                            const allCancel = identifiedConflicts.reduce<Record<string, 'KEEP' | 'CANCEL'>>((acc, c) => ({...acc, [c.id]: 'CANCEL'}), {});
                            setConflictResolutions(allCancel);
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                    >
                        Set all to Cancel
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-3 bg-gray-50/50">
                    {identifiedConflicts.map(appt => {
                        const action = conflictResolutions[appt.id] || 'KEEP';
                        return (
                            <div key={appt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${action === 'CANCEL' ? 'bg-red-50 border-red-100 opacity-80' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <div className="mb-3 sm:mb-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatDate(appt.date)} <span className="text-gray-400">|</span> {formatTime(appt.date)}
                                        </p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${action === 'CANCEL' ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {action === 'CANCEL' ? 'To Be Cancelled' : 'Keeping'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Patient: {patients.find(p => p.id === appt.patientId)?.name || appt.patientId}</p>
                                    <p className="text-xs text-gray-500">Reason: {appt.reason || 'N/A'}</p>
                                </div>
                                
                                <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-center shrink-0">
                                     <button 
                                        onClick={() => setConflictResolutions(prev => ({...prev, [appt.id]: 'KEEP'}))}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${action === 'KEEP' ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                                     >
                                        <Check className="w-3 h-3" />
                                        Keep
                                     </button>
                                     <button 
                                        onClick={() => setConflictResolutions(prev => ({...prev, [appt.id]: 'CANCEL'}))}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${action === 'CANCEL' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-red-600'}`}
                                     >
                                        <X className="w-3 h-3" />
                                        Cancel
                                     </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowConflictModal(false)}
                        className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                    <button 
                        onClick={handleApplyResolutions}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
                    >
                        Confirm & Apply Schedule
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};