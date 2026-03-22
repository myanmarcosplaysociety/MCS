import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Users, Star } from 'lucide-react';

export function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-24 pb-24"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1612487528505-d2338264c821?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        
        <div className="relative px-8 py-24 sm:px-16 sm:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-fuchsia-400 mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide uppercase">Welcome to MCS</span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 drop-shadow-[0_0_30px_rgba(217,70,239,0.3)]">
            Where Cosplay<br />Comes Alive
          </h1>
          
          <p className="max-w-2xl text-lg sm:text-xl text-zinc-400 mb-10 font-medium">
            Join the ultimate community for cosplayers, photographers, and fans. Share your craft, discover events, and connect with creators worldwide.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/highlights"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold text-lg shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:shadow-[0_0_50px_rgba(217,70,239,0.6)] hover:scale-105 transition-all"
            >
              Explore Highlights
            </Link>
            <Link
              to="/events"
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md"
            >
              Find Events
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          {
            title: 'Community Highlights',
            desc: 'Share your latest builds, photoshoots, and WIPs with a supportive community.',
            icon: Star,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
            link: '/highlights'
          },
          {
            title: 'Global Events',
            desc: 'Stay updated on conventions, meetups, and competitions happening near you.',
            icon: Calendar,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
            link: '/events'
          },
          {
            title: 'Connect & Collab',
            desc: 'Find photographers, prop makers, and fellow cosplayers for your next project.',
            icon: Users,
            color: 'text-fuchsia-400',
            bg: 'bg-fuchsia-400/10',
            link: '/profile'
          }
        ].map((feature, i) => (
          <Link key={i} to={feature.link}>
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group cursor-pointer h-full"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-zinc-100">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          </Link>
        ))}
      </section>
    </motion.div>
  );
}
