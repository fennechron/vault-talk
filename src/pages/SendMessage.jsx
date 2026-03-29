import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, ShieldCheck, CheckCircle, UserX } from 'lucide-react';
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
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const getSenderId = () => {
        if (auth.currentUser?.email) return auth.currentUser.email;
        let tempId = localStorage.getItem('whisp_temp_id');
        if (!tempId) {
          tempId = 'temp_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('whisp_temp_id', tempId);
        }
        return tempId;
      };

      await api.sendMessage({
        recipientId: userId,
        senderId: getSenderId(),
        text: message,
      });
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

  if (!recipient) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Immersive Background Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-pink-300/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-rose-300/30 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {isBlocked ? (
          <motion.div
            key="blocked"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-8 sm:p-12 bg-white border border-rose-100 rounded-2xl sm:rounded-[3rem] shadow-2xl backdrop-blur-md w-full max-w-md mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 border border-rose-100 shadow-xl shimmer">
              <UserX className="text-rose-500 w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black mb-4 text-slate-800 tracking-tight">Access Disabled</h2>
            <p className="text-slate-500 text-sm sm:text-lg font-medium mb-8">
              Your ability to send messages has been disabled due to violations of our <span className="text-rose-500 font-bold">Community Standards</span>.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-slate-100 py-4 rounded-xl font-black text-slate-600 hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
            >
              Back to Dashboard
            </button>
          </motion.div>
        ) : !isSent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="glass-morphism p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] w-full max-w-lg relative overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(244,114,182,0.25)]"
          >
            {/* Background design element */}
            <div className="absolute top-0 right-0 w-32 h-32 accent-gradient opacity-10 blur-3xl -mr-16 -mt-16 rounded-full"></div>

            <button
              onClick={() => navigate('/dashboard')}
              className="mb-6 sm:mb-8 flex items-center gap-2 text-pink-400 hover:text-pink-600 transition-colors font-semibold text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
              <span>Back to Class</span>
            </button>

            <div className="flex flex-col items-center mb-6 sm:mb-8 text-center px-2">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-3xl bg-pink-50 flex items-center justify-center border border-pink-100 mb-4 sm:mb-6 shadow-xl shimmer">
                <span className="text-pink-500 font-bold text-2xl sm:text-4xl">{recipient.name.charAt(0)}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Message to <span className="text-pink-500">{recipient.name}</span>
              </h2>
              <div className="flex items-center gap-2 text-pink-400 mt-2 sm:mt-4 text-[8px] sm:text-sm bg-pink-50/50 px-3 sm:px-5 py-1 sm:py-2 rounded-full border border-pink-100 backdrop-blur-sm">
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                <span className="font-bold tracking-wide uppercase">Encrypted & Anonymous</span>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4 sm:space-y-6">
              <textarea
                className="w-full bg-white border-2 border-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 focus:outline-none focus:border-pink-200 focus:ring-4 focus:ring-pink-50 transition-all min-h-[120px] sm:min-h-[180px] text-sm sm:text-lg font-medium resize-none shadow-inner placeholder:text-pink-200 text-slate-700"
                placeholder={`Share your thoughts or feedback anonymously...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full accent-gradient py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-white text-lg sm:text-xl hover:opacity-90 transition-all shadow-xl shadow-pink-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Send Anonymously</span>
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
            className="flex flex-col items-center text-center p-6 sm:p-12 bg-white border border-pink-100 rounded-2xl sm:rounded-[3rem] shadow-2xl backdrop-blur-md w-full max-w-md mx-auto"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-pink-500 rounded-full flex items-center justify-center mb-4 sm:mb-8 shadow-2xl shadow-pink-200 animate-bounce">
              <CheckCircle className="text-white w-8 h-8 sm:w-12 sm:h-12 fill-none" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black mb-2 text-slate-800 tracking-tight">Message Sent!</h2>
            <p className="text-slate-500 text-sm sm:text-lg font-medium">Successfully sent your anonymous message.</p>
            <div className="w-12 h-1.5 bg-pink-100 rounded-full mt-6 sm:mt-8 overflow-hidden">
              <div className="h-full bg-pink-500 w-1/2 animate-shimmer-loading"></div>
            </div>
            <p className="text-pink-300 mt-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest">Redirecting you back...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendMessage;
