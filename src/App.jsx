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
      <div className="min-h-screen flex items-center justify-center relative">
        <FloatingBackground />
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin relative z-10"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen selection:bg-pink-100 selection:text-pink-600 relative overflow-hidden">
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
                className="glass-morphism p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] w-full max-w-md shadow-2xl relative z-10 border border-white/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 accent-gradient opacity-20 blur-3xl -mr-12 -mt-12 rounded-full" />

                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 accent-gradient rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-pink-200 shimmer">
                    <Gavel className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-1 tracking-tight">Community Standards</h2>
                  <p className="text-slate-500 font-medium mb-4 text-[10px] sm:text-xs">
                    Welcome to <span className="text-pink-500 font-bold">Whisp</span>. Please agree to these terms:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-4">
                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl border border-pink-50 hover:border-pink-200 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 group-hover:bg-pink-500 group-hover:text-white transition-all">
                        <AlertTriangle className="w-3.5 h-3.5 text-pink-500 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-700 text-[10px]">No Inappropriate Content</h4>
                        <p className="text-[8px] text-slate-500 leading-tight">Do not use offensive, vulgar, or inappropriate words.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl border border-pink-50 hover:border-pink-200 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 group-hover:bg-pink-500 group-hover:text-white transition-all">
                        <Shield className="w-3.5 h-3.5 text-pink-500 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-700 text-[10px]">Zero Harassment</h4>
                        <p className="text-[8px] text-slate-500 leading-tight">Harassing or bullying other user are strictly prohibited.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl border border-pink-50 hover:border-pink-200 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 group-hover:bg-pink-500 group-hover:text-white transition-all">
                        <UserX className="w-3.5 h-3.5 text-pink-500 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-700 text-[10px]">No Name Mentions</h4>
                        <p className="text-[8px] text-slate-500 leading-tight"> Do not mention anyone’s name in your message to keep it fully anonymous.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl border border-pink-50 hover:border-pink-200 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 group-hover:bg-pink-500 group-hover:text-white transition-all">
                        <Lock className="w-3.5 h-3.5 text-pink-500 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-700 text-[10px]">Report Abuse</h4>
                        <p className="text-[8px] text-slate-500 leading-tight">Immediately report any messages that violate these rules.</p>
                      </div>
                    </div>
                  </div>
                  <div className='text-[9px] text-slate-400 mb-4 text-center leading-tight'>
                    Messages remain safe and anonymous
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAcceptTerms}
                    className="w-full accent-gradient py-3 rounded-xl font-black text-white text-sm sm:text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Agree & Continue
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
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/message/:userId"
              element={<SendMessage />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
