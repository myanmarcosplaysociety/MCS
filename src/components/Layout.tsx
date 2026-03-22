import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Image as ImageIcon, Calendar, Map, FileText, User, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout() {
  const { user, profile, signInWithGoogle, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Highlights', path: '/highlights', icon: ImageIcon },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Roadmap', path: '/roadmap', icon: Map },
    { name: 'Articles', path: '/articles', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-fuchsia-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.5)] group-hover:shadow-[0_0_25px_rgba(217,70,239,0.7)] transition-shadow">
                  <span className="font-bold text-white text-lg">C</span>
                </div>
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">Myanmar Cosplay Society</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-white/10 text-fuchsia-400'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20" />
                    <span className="text-sm font-medium">{profile?.username}</span>
                  </Link>
                  <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-400 transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-zinc-900/95 backdrop-blur-xl"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 ${
                      location.pathname === item.path
                        ? 'bg-white/10 text-fuchsia-400'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-3"
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-white/5 flex items-center gap-3"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { signInWithGoogle(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-fuchsia-400 hover:bg-white/5 flex items-center gap-3"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
