import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skull, Zap, ShieldAlert, ArrowRight, LayoutDashboard, Terminal } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center relative z-10 border-b border-red-900/20 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 accent-gradient rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
            <Skull className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase italic">Whisp</span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/dashboard')}
          className="bg-slate-900 border border-red-900/40 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-red-500 hover:bg-red-950/30 transition-all shadow-sm text-sm sm:text-base flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>DASHBOARD</span>
        </motion.button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 text-center relative">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-red-900/20 blur-[80px] sm:blur-[120px] rounded-full -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-slate-900/40 blur-[60px] sm:blur-[100px] rounded-full -z-10"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 bg-red-950/20 border border-red-900/40 px-4 py-1.5 rounded-full mb-6 sm:mb-8 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="text-red-500 text-[10px] sm:text-xs font-black tracking-widest uppercase">Anonymous Messaging</span>
          </motion.div>

          <h1 className="text-4xl sm:text-7xl md:text-8xl font-black text-white tracking-tightest leading-tight sm:leading-none mb-6 sm:mb-8 uppercase">
            Real Feedback, <br />
            <span className="text-red-600 italic">Total Anonymity.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 font-medium leading-relaxed px-2 sm:px-0 tracking-tight">
            Whisp is a secure platform for sharing honest feedback anonymously. Your identity remains private.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto accent-gradient px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-white font-black text-lg sm:text-xl shadow-[0_10px_40px_rgba(153,27,27,0.4)] flex items-center justify-center gap-3 shimmer uppercase tracking-widest"
            >
              Get Started <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-slate-900 border-2 border-red-900/20 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-slate-300 font-bold text-lg sm:text-xl hover:bg-red-950/20 hover:border-red-900/40 hover:text-red-500 transition-colors shadow-sm uppercase tracking-widest"
            >
              How it works
            </motion.button>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 sm:py-12 px-6 text-center text-slate-500 font-bold border-t border-red-900/10 text-sm sm:text-base bg-slate-950/80 backdrop-blur-md tracking-tight">
        <p>© 2026 Whisp. Secured by <a href="https://fennechron.com" target="_blank" rel="noopener noreferrer" className="text-red-900/60 hover:text-red-600 font-bold transition-colors">FENNECHRON LABS</a>.</p>
      </footer>
    </div>
  );
};

export default Landing;
