import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Calendar, MapPin, Clock, Image as ImageIcon, Upload, Trash2, Video, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface EventHighlight {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  mapUrl?: string;
  coverImage: string;
  mediaUrls: string[];
  createdAt: string;
}

export function EventHighlightsSection() {
  const { user, profile } = useAuth();
  const [highlights, setHighlights] = useState<EventHighlight[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newHighlight, setNewHighlight] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    mapUrl: '',
  });
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'mod';

  useEffect(() => {
    const q = query(collection(db, 'event_highlights'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHighlights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventHighlight)));
    });
    return unsubscribe;
  }, []);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      setMediaFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!coverFile) return toast.error('Please select a cover image');
    if (!newHighlight.title || !newHighlight.date) return toast.error('Please fill in required fields');

    setSubmitting(true);
    try {
      // Upload cover image
      const coverRef = ref(storage, `event_highlights/covers/${Date.now()}_${coverFile.name}`);
      await uploadBytes(coverRef, coverFile);
      const coverUrl = await getDownloadURL(coverRef);

      // Upload media files
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (file) => {
          const mediaRef = ref(storage, `event_highlights/media/${Date.now()}_${file.name}`);
          await uploadBytes(mediaRef, file);
          return getDownloadURL(mediaRef);
        })
      );

      await addDoc(collection(db, 'event_highlights'), {
        ...newHighlight,
        coverImage: coverUrl,
        mediaUrls,
        createdAt: new Date().toISOString()
      });

      toast.success('Event highlight posted!');
      setIsCreating(false);
      setNewHighlight({ title: '', description: '', date: '', location: '', mapUrl: '' });
      setCoverFile(null);
      setCoverPreview(null);
      setMediaFiles([]);
      setMediaPreviews([]);
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast.error('Failed to post highlight');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event highlight?')) return;
    try {
      await deleteDoc(doc(db, 'event_highlights', id));
      toast.success('Highlight deleted');
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast.error('Failed to delete highlight');
    }
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 transition-all"
          >
            {isCreating ? 'Cancel' : 'Add Event Highlight'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {isCreating && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateHighlight} className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-6 mb-8">
              <h2 className="text-2xl font-bold text-white">New Event Highlight</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Event Title *</label>
                    <input
                      required
                      type="text"
                      value={newHighlight.title}
                      onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Date *</label>
                    <input
                      required
                      type="date"
                      value={newHighlight.date}
                      onChange={(e) => setNewHighlight({ ...newHighlight, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={newHighlight.location}
                      onChange={(e) => setNewHighlight({ ...newHighlight, location: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Google Maps URL</label>
                    <input
                      type="url"
                      value={newHighlight.mapUrl}
                      onChange={(e) => setNewHighlight({ ...newHighlight, mapUrl: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                    <textarea
                      value={newHighlight.description}
                      onChange={(e) => setNewHighlight({ ...newHighlight, description: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 min-h-[120px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Cover Image *</label>
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${coverPreview ? 'border-cyan-500 bg-zinc-900/50' : 'border-white/10 hover:border-white/20 bg-zinc-950'}`}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover Preview" className="h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Click to upload cover image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">After Event Photos/Videos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
                      {mediaFiles[index].type.startsWith('video/') ? (
                        <video src={preview} className="w-full h-full object-cover" />
                      ) : (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div 
                    onClick={() => mediaInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-zinc-950 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-zinc-500 mb-2" />
                    <span className="text-xs font-medium text-zinc-500">Add Media</span>
                  </div>
                </div>
                <input
                  type="file"
                  ref={mediaInputRef}
                  onChange={handleMediaSelect}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Event Highlight'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {highlights.length === 0 ? (
        <div className="text-center py-24 border border-white/5 rounded-3xl bg-zinc-900/20">
          <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">No event highlights yet</h3>
          <p className="text-zinc-500 text-lg">Check back later for past event photos and videos!</p>
        </div>
      ) : (
        <div className="space-y-12">
          {highlights.map((highlight) => (
            <motion.div
              key={highlight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden"
            >
              <div className="relative aspect-[21/9] sm:aspect-[3/1] overflow-hidden bg-zinc-950">
                <img
                  src={highlight.coverImage}
                  alt={highlight.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white mb-2">{highlight.title}</h3>
                      <div className="flex flex-wrap gap-4 text-zinc-300 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          {format(new Date(highlight.date), 'MMMM d, yyyy')}
                        </div>
                        {highlight.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-fuchsia-400" />
                            {highlight.location}
                            {highlight.mapUrl && (
                              <a
                                href={highlight.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Map
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(highlight.id)}
                        className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors backdrop-blur-md"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                {highlight.description && (
                  <p className="text-zinc-300 leading-relaxed mb-8 whitespace-pre-wrap">
                    {highlight.description}
                  </p>
                )}
                
                {highlight.mediaUrls && highlight.mediaUrls.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-cyan-400" />
                      Event Gallery
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {highlight.mediaUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-white/5 group">
                          {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                            <>
                              <video src={url} className="w-full h-full object-cover" controls />
                              <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-md pointer-events-none">
                                <Video className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
