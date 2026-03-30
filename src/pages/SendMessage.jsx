import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, ShieldCheck, CheckCircle, UserX, Lock, Skull, Zap, ShieldAlert, Info } from 'lucide-react';
import { api } from '../utils/api';

const SendMessage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState(null);
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(true);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  useEffect(() => {
    const fetchRecipient = async () => {
      // Mock recipient if not in Firestore
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRecipient(docSnap.data());
        } else {
          setRecipient({ name: 'Classmate', photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}` });
        }
      } catch (err) {
        setRecipient({ name: 'Classmate', photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}` });
      }
    };
    fetchRecipient();
  }, [userId]);

  useEffect(() => {
    const checkBlockStatus = async () => {
      const getSenderId = () => {
        if (auth.currentUser?.email) return auth.currentUser.email;
        return localStorage.getItem('whisp_temp_id');
      };

      // Check localStorage first for immediate feedback
      if (localStorage.getItem('whisp_blocked_status') === 'true') {
        setIsBlocked(true);
        setCheckingBlock(false);
        return;
      }

      const sId = getSenderId();
      if (sId) {
        try {
          const data = await api.getMyInfractions(sId);
          if (data.isBlocked) {
            setIsBlocked(true);
            localStorage.setItem('whisp_blocked_status', 'true');
          } else {
            localStorage.removeItem('whisp_blocked_status');
          }
        } catch (err) {
          console.error("Block check failed:", err);
        }
      }
      setCheckingBlock(false);
    };
    checkBlockStatus();

    if (!auth.currentUser) {
      setIsAuthRequired(true);
    }
  }, []);

  const handleSendPrompt = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setShowSafetyModal(true);
  };

  const handleSend = async () => {
    setLoading(true);
    setShowSafetyModal(false);
    try {
      const getSenderId = () => {
        if (auth.currentUser?.email) return auth.currentUser.email;
        throw new Error("You must be signed in to send a message.");
      };

      const sId = getSenderId();
      const idToken = await auth.currentUser.getIdToken();

      await api.sendMessage({
        recipientId: userId,
        senderId: sId,
        text: message,
      }, idToken);
      setIsSent(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      if (error.message.includes('403') || error.message.toLowerCase().includes('disabled')) {
        setIsBlocked(true);
      } else {
        alert("Error sending message: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!recipient) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-600 font-black uppercase tracking-widest">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden bg-slate-950">
      {/* Immersive Background Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-slate-900/30 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {isBlocked ? (
          <motion.div
            key="blocked"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-8 sm:p-12 bg-slate-950/80 border border-red-900/40 rounded-2xl sm:rounded-[3rem] shadow-2xl backdrop-blur-xl w-full max-w-md mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-950/20 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 border border-red-900/30 shadow-xl shimmer">
              <Skull className="text-red-600 w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black mb-4 text-white tracking-tight uppercase italic">Account Blocked</h2>
            <p className="text-slate-500 text-sm sm:text-lg font-black uppercase tracking-tighter mb-8">
              Your account has been blocked due to violations of our <span className="text-red-600">COMMUNITY RULES</span>.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-slate-900 py-4 rounded-xl font-black text-slate-400 hover:text-red-500 transition-all text-xs uppercase tracking-widest border border-red-900/20"
            >
              Go Back
            </button>
          </motion.div>
        ) : isAuthRequired ? (
          <motion.div
            key="auth-required"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-8 sm:p-12 bg-slate-950/80 border border-red-900/40 rounded-2xl sm:rounded-[3rem] shadow-2xl backdrop-blur-xl w-full max-w-md mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-950/20 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 border border-red-900/30 shadow-xl shimmer">
              <ShieldCheck className="text-red-600 w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black mb-4 text-white tracking-tight uppercase italic">Login Required</h2>
            <p className="text-slate-500 text-sm sm:text-lg font-black uppercase tracking-tighter mb-8">
              Please log in with your <span className="text-red-600">@ceconline.edu</span> account to send messages.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/login')}
                className="w-full accent-gradient py-4 rounded-xl font-black text-white hover:opacity-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-red-900/20 shimmer"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-slate-900 py-4 rounded-xl font-black text-slate-500 hover:text-red-500 transition-all text-[10px] uppercase tracking-widest border border-red-900/10"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : !isSent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="glass-morphism p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(153,27,27,0.25)] border-red-900/30"
          >
            {/* Background design element */}
            <div className="absolute top-0 right-0 w-32 h-32 accent-gradient opacity-10 blur-3xl -mr-16 -mt-16 rounded-full"></div>

            <button
              onClick={() => navigate('/dashboard')}
              className="mb-6 sm:mb-8 flex items-center gap-2 text-red-600 hover:text-red-500 transition-colors font-black text-xs sm:text-sm uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Go Back</span>
            </button>

            <div className="flex flex-col items-center mb-6 sm:mb-8 text-center px-2">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-3xl bg-red-950/40 flex items-center justify-center border border-red-900/30 mb-4 sm:mb-6 shadow-xl shimmer">
                <span className="text-red-600 font-bold text-2xl sm:text-4xl italic">{recipient.name.charAt(0)}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight italic">
                Message to <span className="text-red-600">{recipient.name}</span>
              </h2>
              <div className="flex items-center gap-2 text-red-500 mt-2 sm:mt-4 text-[8px] sm:text-[10px] bg-red-950/40 px-3 sm:px-5 py-1 sm:py-2 rounded-full border border-red-900/30 backdrop-blur-xl">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 fill-red-600" />
                <span className="font-black tracking-[0.2em] uppercase">Private & Anonymous</span>
              </div>
            </div>



            <form onSubmit={handleSendPrompt} className="space-y-4 sm:space-y-6">
              <textarea
                className="w-full bg-slate-950/50 border-2 border-red-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-8 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-900/10 transition-all min-h-[120px] sm:min-h-[180px] text-sm sm:text-lg font-medium tracking-normal resize-none shadow-inner placeholder:text-slate-800 text-white"
                placeholder={`Type your message here...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full accent-gradient py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-white text-lg sm:text-xl hover:opacity-95 transition-all shadow-xl shadow-red-900/30 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest shimmer"
              >
                {loading ? 'TRANSMITTING...' : (
                  <>
                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center p-6 sm:p-12 bg-slate-950/80 border border-red-900/40 rounded-2xl sm:rounded-[3rem] shadow-2xl backdrop-blur-xl w-full max-w-md mx-auto"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-600 rounded-full flex items-center justify-center mb-4 sm:mb-8 shadow-2xl shadow-red-900/50 animate-pulse">
              <CheckCircle className="text-white w-8 h-8 sm:w-12 sm:h-12 fill-none" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black mb-2 text-white tracking-tightest uppercase italic">MESSAGE SENT</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-black uppercase tracking-widest">Your message has been sent successfully.</p>
            <div className="w-12 h-1.5 bg-red-900/20 rounded-full mt-6 sm:mt-8 overflow-hidden">
              <div className="h-full bg-red-600 w-1/2 animate-shimmer-loading"></div>
            </div>
            <p className="text-red-900 mt-4 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">RETURNING TO DASHBOARD...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Agreement Modal */}
      <AnimatePresence>
        {showSafetyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSafetyModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border-2 border-red-900/40 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 w-full max-w-xl shadow-[0_0_100px_rgba(153,27,27,0.2)] overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-red-950/40 rounded-[2rem] flex items-center justify-center border border-red-900/30 mx-auto mb-8 shadow-xl shimmer">
                  <ShieldAlert className="w-10 h-10 text-red-600" />
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 uppercase tracking-tightest italic">SAFETY AGREEMENT</h2>

                <div className="space-y-6 text-left mb-10">
                  <div className="bg-red-950/20 border border-red-900/10 p-5 rounded-2xl">
                    <p className="text-slate-200 text-sm sm:text-base font-bold leading-relaxed uppercase tracking-tighter">
                      Do not include <span className="text-red-500 font-black">abusive or inappropriate words</span> that mentally affect others.
                    </p>
                    <p className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest leading-relaxed mt-4 opacity-70">
                      If reported, your account will be <span className="text-red-600">flagged</span> and your message forwarded to administration.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-red-900/10">
                      <Lock className="w-6 h-6 text-red-950" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Messages are fully encrypted</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-red-900/10">
                      <UserX className="w-6 h-6 text-red-950" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Sender ID hidden from receiver</span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] text-center opacity-50">
                    Admins only access messages in the event of a report.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSend}
                    className="flex-1 accent-gradient py-4 sm:py-5 rounded-2xl font-black text-white text-base sm:text-lg hover:opacity-95 transition-all shadow-xl shadow-red-900/30 uppercase tracking-widest shimmer order-2 sm:order-1"
                  >
                    I Agree & Send
                  </button>
                  <button
                    onClick={() => setShowSafetyModal(false)}
                    className="flex-1 bg-slate-950 py-4 sm:py-5 rounded-2xl font-black text-slate-500 hover:text-red-500 transition-all border border-red-900/20 uppercase tracking-widest text-xs sm:text-sm order-1 sm:order-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendMessage;
