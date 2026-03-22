import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { EventHighlightsSection } from '../components/EventHighlightsSection';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'highlights'>('upcoming');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
    });
    return unsubscribe;
  }, []);

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

      <div className="flex justify-center mb-12">
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
      </div>

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
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">{event.title}</h3>
                    <p className="text-zinc-400 text-sm line-clamp-3 mb-6 leading-relaxed">{event.description}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-cyan-500" />
                      {event.location}
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
