import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, increment, getDoc, setDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Flag, Image as ImageIcon, Send, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export function Highlights() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', tags: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
    }, (error) => {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load highlights');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeCommentPost) return;
    const q = query(collection(db, 'comments'), where('postId', '==', activeCommentPost), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
    return unsubscribe;
  }, [activeCommentPost]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!selectedFile) return toast.error('Please select an image');

    setSubmitting(true);
    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `highlights/${user.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      const tagsArray = newPost.tags.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 10);
      
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile.username,
        authorAvatar: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        imageUrl: downloadUrl,
        caption: newPost.caption,
        tags: tagsArray,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Highlight posted!');
      setIsCreating(false);
      setNewPost({ caption: '', tags: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to post highlight');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    if (!user) return toast.error('Please sign in to like posts');
    
    const likeId = `${user.uid}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', postId);

    try {
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          postId,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like post');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this highlight?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success('Highlight deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete highlight');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !activeCommentPost || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        postId: activeCommentPost,
        authorId: user.uid,
        authorName: profile.username,
        authorAvatar: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      });
      
      await updateDoc(doc(db, 'posts', activeCommentPost), {
        commentsCount: increment(1)
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(-1)
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Community Highlights</h1>
          <p className="text-zinc-400">Discover and share the best cosplay moments.</p>
        </div>
        {user && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 transition-all"
          >
            Share Highlight
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreatePost} className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-4 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">New Highlight</h2>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${previewUrl ? 'border-fuchsia-500 bg-zinc-900/50' : 'border-white/10 hover:border-white/20 bg-zinc-950'}`}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs mt-1">Max 5MB (JPEG, PNG)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Caption</label>
                <textarea
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all min-h-[100px]"
                  placeholder="Tell us about this cosplay..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                  placeholder="anime, armor, prop..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-colors"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
              <img
                src={post.imageUrl}
                alt={post.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.id}/600/800`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="flex gap-2 flex-wrap mb-3">
                  {post.tags?.map((tag, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium bg-white/20 backdrop-blur-md rounded-md text-white">
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-white text-sm line-clamp-3 font-medium">{post.caption}</p>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full border border-white/10" />
                  <div>
                    <p className="font-bold text-white text-sm">{post.authorName}</p>
                    <p className="text-xs text-zinc-500">{formatDistanceToNow(new Date(post.createdAt))} ago</p>
                  </div>
                </div>
                
                {(user?.uid === post.authorId || profile?.role === 'admin' || profile?.role === 'mod') && (
                  <button onClick={() => handleDelete(post.id)} className="text-zinc-500 hover:text-red-400 p-2 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-6 text-zinc-400">
                <button onClick={() => handleLike(post.id, post.likesCount)} className="flex items-center gap-2 hover:text-fuchsia-400 transition-colors group/btn">
                  <Heart className="w-5 h-5 group-hover/btn:fill-fuchsia-400/20" />
                  <span className="text-sm font-medium">{post.likesCount}</span>
                </button>
                <button onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.commentsCount}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-white transition-colors ml-auto">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence>
                {activeCommentPost === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="space-y-4 max-h-48 overflow-y-auto pr-2 mb-4 custom-scrollbar">
                      {comments.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-2">No comments yet. Be the first!</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full border border-white/10" />
                            <div className="flex-1 bg-zinc-950/50 rounded-2xl rounded-tl-none p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white text-xs">{comment.authorName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-500">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                                  {(user?.uid === comment.authorId || profile?.role === 'admin' || profile?.role === 'mod') && (
                                    <button onClick={() => handleDeleteComment(comment.id, post.id)} className="text-zinc-500 hover:text-red-400">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-zinc-300">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {user ? (
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 bg-zinc-950 border border-white/10 rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !newComment.trim()}
                          className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-center text-zinc-500">Sign in to comment</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="text-center py-24 border border-white/5 rounded-3xl bg-zinc-900/20">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No highlights yet</h3>
          <p className="text-zinc-500">Be the first to share your cosplay!</p>
        </div>
      )}
    </motion.div>
  );
}
