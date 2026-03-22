import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FileText, ArrowRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  authorId: string;
  createdAt: string;
}

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
    });
    return unsubscribe;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-12"
    >
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">News & Announcements</h1>
          <p className="text-zinc-400 text-lg">Stay updated with the latest from Myanmar Cosplay Society.</p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-32 border border-white/5 rounded-3xl bg-zinc-900/20">
          <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">No articles yet</h3>
          <p className="text-zinc-500 text-lg">Check back later for news and updates!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <motion.article
              key={article.id}
              whileHover={{ y: -5 }}
              className="group bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden hover:border-fuchsia-500/50 transition-colors shadow-[0_0_0_rgba(217,70,239,0)] hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col h-full"
            >
              <div className="relative aspect-video overflow-hidden bg-zinc-950">
                <img
                  src={article.imageUrl || `https://picsum.photos/seed/${article.id}/800/400`}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-fuchsia-400">
                    {article.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(article.createdAt))} ago
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-zinc-400 text-sm line-clamp-3 mb-6 leading-relaxed flex-1">
                  {article.content}
                </p>
                
                <button className="mt-auto flex items-center gap-2 text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors group/btn">
                  Read More
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  );
}
