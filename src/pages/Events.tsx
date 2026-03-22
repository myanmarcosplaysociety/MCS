import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Calendar, MapPin, Clock, Users, ArrowRight, Upload, Trash2, ExternalLink, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { EventHighlightsSection } from '../components/EventHighlightsSection';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  mapUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export function Events() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'highlights'>('upcoming');
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    mapUrl: '',
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'mod';

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
    });
    return unsubscribe;
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newEvent.title || !newEvent.date) return toast.error('Please fill in required fields');

    setSubmitting(true);
    try {
      let imageUrl = '';
      if (selectedFile) {
        const storageRef = ref(storage, `events/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'events'), {
        ...newEvent,
        imageUrl,
        createdAt: new Date().toISOString()
      });

      toast.success('Event created!');
      setIsCreating(false);
      setNewEvent({ title: '', description: '', date: '', location: '', mapUrl: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('Event deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-5xl font-black tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-400">Events</h1>
        <p className="text-xl text-zinc-400">Discover conventions, meetups, and past event highlights.</p>
      </div>

      <div className="flex justify-center items-center gap-4 mb-12">
        <div className="bg-zinc-900/50 p-1 rounded-full border border-white/10 flex">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-3 rounded-full font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`px-8 py-3 rounded-full font-bold transition-all ${
              activeTab === 'highlights'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Event Highlights
          </button>
        </div>
        {isAdmin && activeTab === 'upcoming' && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-3 rounded-full bg-zinc-900/50 border border-white/10 text-white hover:bg-white hover:text-black transition-all"
            title="Add Event"
          >
            {isCreating ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreating && activeTab === 'upcoming' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateEvent} className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-6 mb-12">
              <h2 className="text-2xl font-bold text-white">Create New Event</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Title *</label>
                    <input
                      required
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Date *</label>
                    <input
                      required
                      type="datetime-local"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Google Maps URL</label>
                    <input
                      type="url"
                      value={newEvent.mapUrl}
                      onChange={(e) => setNewEvent({ ...newEvent, mapUrl: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 min-h-[150px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Event Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${previewUrl ? 'border-cyan-500 bg-zinc-900/50' : 'border-white/10 hover:border-white/20 bg-zinc-950'}`}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full object-contain p-2" />
                      ) : (
                        <div className="flex flex-col items-center text-zinc-500">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-xs">Upload Image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'upcoming' ? (
        events.length === 0 ? (
          <div className="text-center py-32 border border-white/5 rounded-3xl bg-zinc-900/20">
            <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No upcoming events</h3>
            <p className="text-zinc-500 text-lg">Check back later for new conventions and meetups!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -5 }}
                className="group flex flex-col sm:flex-row bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-colors shadow-[0_0_0_rgba(6,182,212,0)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
              >
                <div className="sm:w-2/5 relative aspect-video sm:aspect-auto overflow-hidden bg-zinc-950">
                  <img
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/600/800`}
                    alt={event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{format(new Date(event.date), 'MMM')}</p>
                    <p className="text-2xl font-black text-white leading-none">{format(new Date(event.date), 'dd')}</p>
                  </div>
                </div>
                
                <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{event.title}</h3>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-3 mb-6 leading-relaxed">{event.description}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        {event.location}
                      </div>
                      {event.mapUrl && (
                        <a
                          href={event.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Map
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                      <Clock className="w-4 h-4 text-fuchsia-500" />
                      {format(new Date(event.date), 'h:mm a')}
                    </div>
                    
                    <button className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-colors flex items-center justify-center gap-2 group/btn">
                      View Details
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <EventHighlightsSection />
      )}
    </motion.div>
  );
}
