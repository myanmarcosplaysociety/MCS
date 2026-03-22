import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Rocket, Star, Users } from 'lucide-react';

export function Roadmap() {
  const milestones = [
    {
      title: 'Platform Launch',
      description: 'Core features including user profiles, highlight sharing, and basic moderation.',
      status: 'completed',
      date: 'Q1 2026',
      icon: Rocket,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      title: 'Events & Ticketing',
      description: 'Discover local conventions, RSVP to meetups, and purchase tickets directly.',
      status: 'in-progress',
      date: 'Q2 2026',
      icon: Clock,
      color: 'text-fuchsia-400',
      bg: 'bg-fuchsia-400/10'
    },
    {
      title: 'Creator Monetization',
      description: 'Allow top cosplayers to offer exclusive content, tutorials, and behind-the-scenes access.',
      status: 'planned',
      date: 'Q3 2026',
      icon: Star,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10'
    },
    {
      title: 'Guilds & Groups',
      description: 'Create private or public groups for specific fandoms, regions, or crafting specialties.',
      status: 'planned',
      date: 'Q4 2026',
      icon: Users,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-16"
    >
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-black tracking-tight text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-yellow-400">
          The Journey Ahead
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          See what we're building next. Our roadmap is driven by the community, for the community.
        </p>
      </div>

      <div className="relative border-l-2 border-white/10 ml-6 md:ml-12 pl-8 md:pl-16 space-y-16 py-8">
        {milestones.map((milestone, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] md:-left-[73px] w-12 h-12 rounded-full ${milestone.bg} border-4 border-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>
              {milestone.status === 'completed' ? (
                <CheckCircle2 className={`w-6 h-6 ${milestone.color}`} />
              ) : milestone.status === 'in-progress' ? (
                <Clock className={`w-6 h-6 ${milestone.color}`} />
              ) : (
                <Circle className={`w-6 h-6 ${milestone.color}`} />
              )}
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${milestone.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <milestone.icon className={`w-6 h-6 ${milestone.color}`} />
                  </div>
                  <h3 className="text-3xl font-bold text-white">{milestone.title}</h3>
                </div>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold uppercase tracking-wider text-zinc-300">
                  {milestone.date}
                </span>
              </div>
              
              <p className="text-zinc-400 text-lg leading-relaxed">{milestone.description}</p>
              
              <div className="mt-8 flex items-center gap-3">
                <div className="h-2 flex-1 bg-zinc-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      milestone.status === 'completed' ? 'bg-emerald-500 w-full' :
                      milestone.status === 'in-progress' ? 'bg-fuchsia-500 w-1/2 relative overflow-hidden' :
                      'bg-zinc-800 w-0'
                    }`}
                  >
                    {milestone.status === 'in-progress' && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 w-24 text-right">
                  {milestone.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
