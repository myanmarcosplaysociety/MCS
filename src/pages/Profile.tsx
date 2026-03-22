import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Settings, Image as ImageIcon, Edit3, Save, X, Upload, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
}

export function Profile() {
  const { user, profile } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        bio: profile.bio || '',
      });
      setPreviewUrl(profile.avatarUrl || null);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      const q = query(collection(db, 'posts'), where('authorId', '==', user.uid));
      const snapshot = await getDocs(q);
      setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    };
    fetchPosts();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let finalAvatarUrl = profile?.avatarUrl || '';
      
      if (selectedFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalAvatarUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        username: editForm.username,
        bio: editForm.bio,
        avatarUrl: finalAvatarUrl
      });
      
      toast.success('Profile updated! Refresh to see changes.');
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Sign in to view your profile</h2>
        <p className="text-zinc-400">Join the community to share your cosplays and connect with others.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      {/* Profile Header */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 mix-blend-overlay" />
        
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="relative group">
            <img
              src={previewUrl || profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
              alt={profile.username}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-zinc-950 shadow-[0_0_30px_rgba(217,70,239,0.3)] object-cover"
            />
            {isEditing && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="w-8 h-8 text-white" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-4 w-full max-w-md">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <h1 className="text-4xl font-black text-white">{profile.username}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-fuchsia-400 mx-auto sm:mx-0">
                    {profile.role}
                  </span>
                </div>
                <p className="text-zinc-400 text-lg max-w-xl mb-6 leading-relaxed">
                  {profile.bio || "No bio added yet. Tell the community about your cosplay journey!"}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-3xl font-black text-white">{userPosts.length}</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Highlights</p>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="text-center sm:text-left">
                    <p className="text-3xl font-black text-white">
                      {userPosts.reduce((acc, post) => acc + (post.likesCount || 0), 0)}
                    </p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Likes</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* User's Highlights Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-fuchsia-400" />
            Your Highlights
          </h2>
          
          {(profile.role === 'admin' || profile.role === 'mod') && (
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-sm font-bold hover:bg-cyan-600/30 transition-colors">
                + New Event
              </button>
              <button className="px-4 py-2 rounded-full bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 text-sm font-bold hover:bg-fuchsia-600/30 transition-colors">
                + New Article
              </button>
            </div>
          )}
        </div>
        
        {userPosts.length === 0 ? (
          <div className="text-center py-24 border border-white/5 rounded-3xl bg-zinc-900/20">
            <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No highlights yet</h3>
            <p className="text-zinc-500">Share your first cosplay highlight with the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userPosts.map((post) => (
              <div key={post.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.id}/400/400`;
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Heart className="w-6 h-6 fill-fuchsia-500 text-fuchsia-500" />
                    {post.likesCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
