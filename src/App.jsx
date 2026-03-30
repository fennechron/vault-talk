import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from './firebase';
import { Gavel, AlertTriangle, Shield, Lock, CheckCircle2, UserX } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendMessage from './pages/SendMessage';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import FloatingBackground from './components/FloatingBackground';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const accepted = localStorage.getItem('whisp_terms_accepted');
    if (!accepted) {
      setShowTerms(true);
    }

    return () => unsubscribe();
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('whisp_terms_accepted', 'true');
    setShowTerms(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-slate-950">
        <FloatingBackground />
        <div className="w-12 h-12 border-4 border-slate-900 border-t-red-600 rounded-full animate-spin relative z-10"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen selection:bg-red-900 selection:text-white relative overflow-hidden bg-slate-950 text-slate-300">
        <AnimatePresence>
          {showTerms && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-950/90 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] w-full max-w-lg shadow-2xl relative z-10 border border-red-900/30 overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-16 -mt-16 rounded-full" />

                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-950/20 rounded-2xl flex items-center justify-center mb-4 border border-red-900/30 shadow-xl shadow-red-900/10 rotate-3">
                    <Gavel className="text-red-600 w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-white mb-2 tracking-tightest uppercase italic">COMMUNITY RULES</h2>
                  <p className="text-slate-500 font-black mb-6 text-[10px] sm:text-xs uppercase tracking-widest leading-relaxed">
                    Guidelines for using <span className="text-red-600">WHISP</span>:
                  </p>

                  <div className="grid grid-cols-1 gap-3 w-full mb-8">
                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-red-900/10 hover:border-red-900/30 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-red-950/20 flex items-center justify-center shrink-0 border border-red-900/20 group-hover:bg-red-600 group-hover:text-white transition-all">
                        <AlertTriangle className="w-5 h-5 text-red-600 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-white text-xs uppercase tracking-tight">RESPECT OTHERS</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter leading-tight opacity-70">Hate speech, bullying, or vulgar messages will be removed.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-red-900/10 hover:border-red-900/30 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-red-950/20 flex items-center justify-center shrink-0 border border-red-900/20 group-hover:bg-red-600 group-hover:text-white transition-all">
                        <Shield className="w-5 h-5 text-red-600 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-white text-xs uppercase tracking-tight">STAY ANONYMOUS</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter leading-tight opacity-70">Do not share real names or sensitive info to protect your privacy.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-red-900/10 hover:border-red-900/30 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-red-950/20 flex items-center justify-center shrink-0 border border-red-900/20 group-hover:bg-red-600 group-hover:text-white transition-all">
                        <UserX className="w-5 h-5 text-red-600 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-white text-xs uppercase tracking-tight">NO HARASSMENT</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter leading-tight opacity-70">Repeated harassment will result in your account being blocked.</p>
                      </div>
                    </div>
                  </div>

                  <div className='text-[10px] text-red-900/60 font-black mb-6 text-center uppercase tracking-[0.3em]'>
                    Ready to Continue
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAcceptTerms}
                    className="w-full accent-gradient py-4 rounded-xl font-black text-white text-sm sm:text-base shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 transition-all hover:opacity-95 uppercase tracking-widest shimmer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    I AGREE
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <FloatingBackground />
        <div className="relative z-10 w-full h-full min-h-screen">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/message/:userId"
              element={<SendMessage />}
            />
            <Route
              path="/admin"
              element={<Admin />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
