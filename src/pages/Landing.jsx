import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { Shield, Lock, ArrowRight, LayoutDashboard } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 accent-gradient rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
            <Lock className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter">Whisp</span>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/dashboard')}
          className="bg-white border border-pink-100 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-slate-600 hover:bg-pink-50 transition-all shadow-sm text-sm sm:text-base flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </motion.button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 text-center relative">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-pink-200/20 blur-[80px] sm:blur-[120px] rounded-full -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-rose-200/20 blur-[60px] sm:blur-[100px] rounded-full -z-10"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 px-4 py-1.5 rounded-full mb-6 sm:mb-8 shadow-sm"
          >
            <Shield className="w-4 h-4 text-pink-500" />
            <span className="text-pink-600 text-[10px] sm:text-xs font-bold tracking-wide uppercase">End-to-End Encrypted</span>
          </motion.div>

          <h1 className="text-4xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-tightest leading-tight sm:leading-none mb-6 sm:mb-8">
            Share Thoughts, <br />
            <span className="text-pink-500">Stay Anonymous.</span>
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-12 font-medium leading-relaxed px-2 sm:px-0">
            VaultTalk is a secure platform to share feedback and connect with your classmates honestly. Your identity is always protected.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto accent-gradient px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-white font-black text-lg sm:text-xl shadow-[0_10px_40px_rgba(244,114,182,0.4)] flex items-center justify-center gap-3 shimmer"
            >
              Get Started <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-white border-2 border-pink-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-slate-700 font-bold text-lg sm:text-xl hover:bg-pink-50/50 hover:border-pink-100 hover:text-pink-600 transition-colors shadow-sm"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 sm:py-12 px-6 text-center text-slate-400 font-medium border-t border-pink-50 text-sm sm:text-base">
        <p>© 2026 VaultTalk. Developed by <a href="https://fennechron.com" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-500 font-bold transition-colors">Fennechron Labs</a>. <br className="sm:hidden" /> Crafted with love.</p>
      </footer>
    </div>
  );
};

export default Landing;
