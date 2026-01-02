import React, { useState, useMemo, useEffect } from 'react';
import { useHMS } from '../context/HMSContext';
import { AppointmentStatus, Doctor, WeeklySchedule, Appointment } from '../types';
import { Calendar, Clock, User, CheckCircle, XCircle, Trash2, Settings, Save, X, AlertTriangle, ArrowRight, Info, PlusCircle, Edit } from 'lucide-react';

export const DoctorView: React.FC = () => {
  const { currentUser, appointments, patients, cancelAppointment, updateDoctorSlots, checkScheduleConflicts, applyWeeklySchedule, bookAppointment, createPatient } = useHMS();
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
          cancelAppointment(selectedAppointment.id);
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
        setShowConflictModal(true);
    } else {
        // No conflicts, apply directly
        applyWeeklySchedule(currentDoctor.id, weeklyConfig, scheduleStartDate, 'KEEP');
        setShowConfigModal(false);
    }
  };

  const handleResolveConflicts = (action: 'CANCEL' | 'KEEP') => {
      applyWeeklySchedule(currentDoctor.id, weeklyConfig, scheduleStartDate, action);
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
                          <div key={appt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                              <div className="flex items-start sm:items-center gap-4">
                                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full shrink-0">
                                      <User className="h-6 w-6" />
                                  </div>
                                  <div>
                                      <h4 className="font-medium text-gray-900">Patient ID: {appt.patientId}</h4>
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
                                    onClick={() => cancelAppointment(appt.id)} 
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                  >
                                      <XCircle className="w-4 h-4" />
                                      Cancel
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
              {/* Toolbar */}
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

      {/* Appointment Details Modal */}
      {selectedAppointment && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Appointment Details
                    </h3>
                    <button onClick={() => setSelectedAppointment(null)} className="text-indigo-400 hover:text-indigo-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                     <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <div className="bg-white p-2 rounded-lg text-gray-500 shadow-sm">
                             <Calendar className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Date & Time</p>
                             <p className="font-semibold text-gray-900">
                                 {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.date)}
                             </p>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <div className="bg-white p-2 rounded-lg text-gray-500 shadow-sm">
                             <User className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Patient</p>
                             <p className="font-semibold text-gray-900">
                                {(() => {
                                    const p = patients.find(p => p.id === selectedAppointment.patientId);
                                    return p ? p.name : `Guest (${selectedAppointment.patientId})`;
                                })()}
                             </p>
                         </div>
                     </div>

                     <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Reason</p>
                         <p className="text-sm text-gray-700 italic">"{selectedAppointment.reason || 'No reason provided'}"</p>
                     </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                    <button 
                        onClick={handleCancelAppointment}
                        className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancel Appointment
                    </button>
                    <button 
                        onClick={() => setSelectedAppointment(null)}
                        className="w-full py-2.5 text-gray-500 hover:bg-gray-100 font-medium rounded-xl transition-colors"
                    >
                        Close
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Weekly Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Schedule Conflicts Detected</h3>
                    </div>
                    <p className="text-sm text-amber-800">
                        The new schedule removes slots for <strong>{identifiedConflicts.length} existing appointments</strong>.
                    </p>
                </div>
                
                <div className="p-6 max-h-[40vh] overflow-y-auto">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Impacted Appointments</h4>
                    <div className="space-y-3">
                        {identifiedConflicts.map(appt => (
                            <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(appt.date)} at {formatTime(appt.date)}</p>
                                    <p className="text-xs text-gray-500">Patient ID: {appt.patientId}</p>
                                </div>
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Will be lost</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                    <button 
                        onClick={() => handleResolveConflicts('CANCEL')}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancel Conflicting Appointments
                    </button>
                    <button 
                        onClick={() => handleResolveConflicts('KEEP')}
                        className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-sm transition-colors text-sm"
                    >
                        Keep Appointments (Merge with new schedule)
                    </button>
                    <button 
                        onClick={() => setShowConflictModal(false)}
                        className="text-center text-xs text-gray-500 hover:text-gray-700 mt-1"
                    >
                        Abort Operation
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};