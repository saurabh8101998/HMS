import React, { useState, useMemo } from 'react';
import { useHMS } from '../context/HMSContext';
import { suggestSpecialist } from '../services/geminiService';
import { Doctor, AppointmentStatus } from '../types';
import { Search, Sparkles, Calendar, Clock, MapPin, CheckCircle, X, Lock, ChevronRight } from 'lucide-react';

export const PatientView: React.FC = () => {
  const { doctors, bookAppointment, appointments, currentUser, rescheduleAppointment, cancelAppointment, registerGuestPatient } = useHMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'find' | 'my'>('find');
  
  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reschedulingApptId, setReschedulingApptId] = useState<string | null>(null);

  // Guest Form State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const handleSymptomAnalysis = async () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    const suggestion = await suggestSpecialist(symptoms);
    setIsAnalyzing(false);
    if (suggestion) {
      setSelectedSpecialty(suggestion);
      setSearchTerm(suggestion); // Auto-filter
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty ? doc.specialty === selectedSpecialty : true;
    return matchesSearch && matchesSpecialty;
  });

  const myAppointments = appointments
    .filter(a => currentUser && a.patientId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Helpers for formatting ---
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Group doctor's slots by date for the booking modal
  const groupedSlots = useMemo(() => {
    if (!bookingDoctor) return {};
    return bookingDoctor.availableSlots.reduce((acc, slot) => {
      const dateKey = formatDate(slot);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {} as Record<string, string[]>);
  }, [bookingDoctor]);

  const handleBookingConfirm = () => {
    if (!selectedSlot || !bookingDoctor) return;

    if (reschedulingApptId) {
        rescheduleAppointment(reschedulingApptId, selectedSlot);
    } else {
        let pId = currentUser?.id;
        
        // Handle Guest Registration
        if (!currentUser) {
            if (!guestName || !guestEmail) {
                alert("Please provide your details to confirm the booking.");
                return;
            }
            const newPatient = registerGuestPatient(guestName, guestEmail);
            pId = newPatient.id;
        }

        bookAppointment(bookingDoctor.id, selectedSlot, 'General Consultation', pId);
    }

    // Reset State
    setBookingDoctor(null);
    setSelectedSlot(null);
    setReschedulingApptId(null);
    setGuestName('');
    setGuestEmail('');
    setActiveTab('my');
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('find')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'find' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Find a Doctor
        </button>
        <button
          onClick={() => currentUser ? setActiveTab('my') : alert("Please book an appointment first to create your profile.")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'my' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          My Appointments
        </button>
      </div>

      {activeTab === 'find' && (
        <>
          {/* AI Symptom Checker */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm text-blue-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900 mb-1">Not sure who to see?</h3>
                <p className="text-sm text-gray-600 mb-4">Describe your symptoms and our AI will recommend the right specialist.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. persistent headache and sensitivity to light"
                    className="flex-grow px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSymptomAnalysis()}
                  />
                  <button
                    onClick={handleSymptomAnalysis}
                    disabled={isAnalyzing || !symptoms}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
                  </button>
                </div>
                {selectedSpecialty && (
                   <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      Recommended: {selectedSpecialty}
                      <button onClick={() => { setSelectedSpecialty(null); setSearchTerm(''); }} className="ml-2 hover:text-green-900">
                        <X className="w-3 h-3" />
                      </button>
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, or hospital..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <img src={doctor.imageUrl} alt={doctor.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {doctor.hospital}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-grow">{doctor.bio}</p>
                
                <div className="mt-auto">
                    <button
                        onClick={() => { setBookingDoctor(doctor); setSelectedSlot(null); }}
                        className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        View Profile & Book
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
            {filteredDoctors.length === 0 && (
                 <div className="col-span-full text-center py-12 text-gray-500">
                     <p>No doctors found matching your criteria.</p>
                     <button onClick={() => {setSearchTerm(''); setSelectedSpecialty(null);}} className="text-blue-600 font-medium mt-2 hover:underline">Clear filters</button>
                 </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'my' && (
        <div className="space-y-4">
            {!currentUser ? (
                <div className="text-center py-12">
                    <p>Please log in or book an appointment to view this section.</p>
                </div>
            ) : myAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">No appointments yet</h3>
                    <p className="text-gray-500 text-sm mb-4">You haven't booked any appointments yet.</p>
                    <button onClick={() => setActiveTab('find')} className="text-blue-600 hover:underline text-sm font-medium">Find a doctor</button>
                </div>
            ) : (
                myAppointments.map(appt => {
                    const doctor = doctors.find(d => d.id === appt.doctorId);
                    if (!doctor) return null;
                    const isPast = new Date(appt.date) < new Date();
                    return (
                        <div key={appt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex gap-4 items-start">
                                <div className={`p-3 rounded-xl ${appt.status === AppointmentStatus.CANCELLED ? 'bg-red-50 text-red-500' : isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        Dr. {doctor.name}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                                            appt.status === AppointmentStatus.CANCELLED ? 'bg-red-100 text-red-700' : 
                                            isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {appt.status}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500">{doctor.specialty} • {doctor.hospital}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400"/> {formatDate(appt.date)}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400"/> {formatTime(appt.date)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            {appt.status !== AppointmentStatus.CANCELLED && !isPast && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => cancelAppointment(appt.id)}
                                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => { setReschedulingApptId(appt.id); setBookingDoctor(doctor); }}
                                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        Reschedule
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      )}

      {/* Booking Modal */}
      {(bookingDoctor) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div className="flex items-center gap-3">
                    <img src={bookingDoctor.imageUrl} className="w-10 h-10 rounded-full border border-gray-200" />
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                            {reschedulingApptId ? 'Reschedule' : 'Book Appointment'}
                        </h3>
                        <p className="text-xs text-gray-500">Dr. {bookingDoctor.name}</p>
                    </div>
                </div>
                <button onClick={() => { setBookingDoctor(null); setSelectedSlot(null); setReschedulingApptId(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                {!selectedSlot ? (
                     <div className="space-y-6">
                        {bookingDoctor.availableSlots.length > 0 ? (
                             Object.entries(groupedSlots).map(([date, slots]) => (
                                <div key={date}>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white py-1">{date}</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {slots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedSlot(slot)}
                                                className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-white border border-gray-200 text-blue-600 hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm"
                                            >
                                                {formatTime(slot)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             ))
                        ) : (
                            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No available slots found for this doctor.</p>
                            </div>
                        )}
                     </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                            <div>
                                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Selected Slot</span>
                                <div className="text-blue-900 font-semibold">{formatDate(selectedSlot)} at {formatTime(selectedSlot)}</div>
                            </div>
                            <button onClick={() => setSelectedSlot(null)} className="text-xs text-blue-600 hover:underline">Change</button>
                        </div>

                        {!currentUser && !reschedulingApptId && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-sm font-semibold text-gray-900">Your Details</h4>
                                <input 
                                    type="text" 
                                    placeholder="Full Name" 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                />
                                <input 
                                    type="email" 
                                    placeholder="Email Address" 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Your details are secure. An account will be created for you.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                 <button 
                    onClick={() => { setBookingDoctor(null); setSelectedSlot(null); setReschedulingApptId(null); }}
                    className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    disabled={!selectedSlot || (!currentUser && (!guestName || !guestEmail))}
                    onClick={handleBookingConfirm}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                >
                    {reschedulingApptId ? 'Confirm Reschedule' : 'Confirm Booking'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};