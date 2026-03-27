import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, LogOut, Search, Inbox as InboxIcon, Users, MessageSquare, X, CheckCircle, ArrowRight, Home, Lock, Mail, Key, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import CryptoJS from 'crypto-js';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'inbox'
  const [searchTerm, setSearchTerm] = useState('');
  const [reportingMsgId, setReportingMsgId] = useState(null);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const navigate = useNavigate();

  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const currentUserEmail = auth.currentUser?.email;

  useEffect(() => {
    // 1. Fetch Users
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersData.filter(u => u.id !== currentUserEmail));
      } else {
        setUsers([]); 
      }
    });

    return () => usersUnsub();
  }, [currentUserEmail]);

  useEffect(() => {
    // 2. Fetch Received Messages
    if (currentUserEmail) {
      const fetchMessages = async () => {
        try {
          const msgs = await api.getMessages(currentUserEmail);
          
          // Decrypt messages
          const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'vaulttalk-default-secret-key';
          const decryptedMsgs = msgs.map(msg => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.text, encryptionKey);
              const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
              return { ...msg, text: decryptedText || msg.text };
            } catch (err) {
              console.error("Decryption failed for message:", msg.id, err);
              return msg;
            }
          });
          
          setMessages(decryptedMsgs);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      };

      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentUserEmail]);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    
    if (!loginEmail.toLowerCase().endsWith('@ceconline.edu')) {
      setAuthError('Only @ceconline.edu emails are allowed.');
      setIsAuthenticating(false);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const loggedInUser = result.user;
      
      // Update lastLogin
      await setDoc(doc(db, 'users', loggedInUser.email), {
        lastLogin: new Date()
      }, { merge: true });
      
      setIsAuthenticating(false);
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. If you haven\'t set a password yet, please go to the main Login page to Sign Up first.');
      } else {
        setAuthError(error.message);
      }
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;
      
      if (!loggedInUser.email.toLowerCase().endsWith('@ceconline.edu')) {
        await auth.signOut();
        setAuthError('Only @ceconline.edu emails are allowed.');
        setIsAuthenticating(false);
        return;
      }
      
      // Ensure Google users are also in the 'users' collection
      await setDoc(doc(db, 'users', loggedInUser.email), {
        name: loggedInUser.displayName,
        email: loggedInUser.email,
        id: loggedInUser.email,
        photoURL: loggedInUser.photoURL,
        lastLogin: new Date()
      }, { merge: true });
      
      setIsAuthenticating(false);
    } catch (error) {
      setAuthError(error.message);
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const handleReport = async (msg) => {
    setReportingMsgId(msg.id);
    try {
      await api.reportMessage({
        messageId: msg.id,
        recipientId: auth.currentUser?.email,
        text: msg.text,
        senderId: msg.senderId
      });
      setShowReportSuccess(true);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isReported: true } : m));
      setTimeout(() => setShowReportSuccess(false), 2000);
    } catch (error) {
      alert("Error reporting message: " + error.message);
    } finally {
      setReportingMsgId(null);
    }
  };

  const filteredUsers = users
    .filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Success Notification */}
      <AnimatePresence>
        {showReportSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-bold"
          >
            <AlertTriangle className="w-5 h-5" />
            Message Reported Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8 text-center sm:text-left">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/" className="text-3xl sm:text-4xl font-black text-pink-500 inline-block hover:opacity-80 transition-opacity">VaultTalk</Link>
          <p className="text-slate-500 text-sm sm:text-base font-medium">Hello, {auth.currentUser?.displayName || 'Dear Classmate'}</p>
        </motion.div>
        
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 sm:p-3 bg-white border border-pink-100 rounded-xl sm:rounded-2xl hover:bg-pink-50 text-pink-500 transition-all shadow-sm flex items-center gap-2"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-bold text-sm">Home</span>
          </button>
          
          {auth.currentUser ? (
            <button 
              onClick={handleLogout}
              className="p-2.5 sm:p-3 bg-white border border-pink-100 rounded-xl sm:rounded-2xl hover:bg-pink-50 text-pink-500 transition-all shadow-sm flex items-center gap-2"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-sm">Logout</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="p-2.5 sm:p-3 bg-white border border-pink-100 rounded-xl sm:rounded-2xl hover:bg-pink-50 text-pink-500 transition-all shadow-sm flex items-center gap-2"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-sm">Log In</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-pink-50/50 rounded-xl sm:rounded-[2rem] mb-6 sm:mb-8 border border-pink-100/50">
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg sm:rounded-[1.5rem] font-bold text-xs sm:text-base transition-all ${activeTab === 'members' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-pink-400'}`}
        >
          <Users className="w-3.5 h-3.5 sm:w-5 h-5" />
          Classmates
        </button>
        <button 
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg sm:rounded-[1.5rem] font-bold text-xs sm:text-base transition-all ${activeTab === 'inbox' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-pink-400'}`}
        >
          <InboxIcon className="w-3.5 h-3.5 sm:w-5 h-5" />
          Inbox
          {auth.currentUser && messages.length > 0 && (
            <span className="bg-pink-500 text-white text-[8px] sm:text-[10px] w-3.5 h-3.5 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'members' ? (
          <motion.div 
            key="members"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="relative mb-6 sm:mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search for a classmate..." 
                className="w-full bg-white border border-pink-100 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all text-base sm:text-lg font-light shadow-sm placeholder:text-pink-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.03, y: -4, rotate: index % 2 === 0 ? 1 : -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-morphism rounded-2xl sm:rounded-3xl p-4 sm:p-5 cursor-pointer group hover:border-pink-300 transition-all border border-pink-50 shadow-sm bg-white/60 hover:shadow-[0_20px_40px_rgba(244,114,182,0.15)]"
                  onClick={() => navigate(`/message/${user.id}`)}
                >
                  <div className="flex flex-row sm:flex-col items-center sm:text-center gap-4 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100 text-xl sm:text-2xl font-black text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col sm:items-center overflow-hidden flex-1">
                      <h3 className="font-bold text-slate-700 group-hover:text-pink-500 transition-colors truncate w-full text-base sm:text-lg">{user.name}</h3>
                      <div className="bg-pink-50 text-pink-400 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest inline-block mt-1">Send Message</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="inbox"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {!auth.currentUser ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 sm:py-24 bg-white/70 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] border border-pink-100 shadow-2xl max-w-xl mx-auto relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-100/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="w-20 h-20 bg-pink-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-200/50 rotate-3">
                  <Lock className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-800 mb-4 tracking-tight">Unlock Your Inbox</h3>
                <p className="text-slate-500 font-medium mb-8 px-6 text-sm sm:text-lg">
                  Sign in with your <strong className="text-pink-500">@ceconline.edu</strong> email to securely view your messages.
                </p>
                
                <AnimatePresence>
                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 px-6 text-rose-500 text-xs sm:text-sm font-bold bg-rose-50 py-3 rounded-xl mx-6 sm:mx-12 border border-rose-100"
                    >
                      {authError}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <form onSubmit={handleEmailSignIn} className="w-full px-6 sm:px-12 flex flex-col gap-3 sm:gap-4 mb-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 pointer-events-none" />
                    <input 
                      type="email" 
                      placeholder="College Email Address" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full bg-pink-50/30 border border-pink-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all font-light placeholder:text-pink-200 text-sm sm:text-base text-slate-700"
                    />
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 pointer-events-none" />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-pink-50/30 border border-pink-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all font-light placeholder:text-pink-200 text-sm sm:text-base text-slate-700"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full accent-gradient py-3.5 mt-2 rounded-xl font-black text-white hover:opacity-90 transition-all shadow-lg shadow-pink-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isAuthenticating ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                <div className="flex items-center gap-4 px-6 sm:px-12 mb-6 opacity-60">
                  <div className="h-px bg-pink-200 flex-1"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500">OR</span>
                  <div className="h-px bg-pink-200 flex-1"></div>
                </div>

                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  type="button"
                  className="mx-auto bg-white border-2 border-pink-50 py-3 px-6 sm:px-8 rounded-xl font-bold text-slate-600 hover:bg-pink-50 hover:border-pink-200 transition-transform duration-300 flex items-center justify-center gap-3 shadow-[0_5px_15px_rgba(244,114,182,0.1)] hover:-translate-y-1 disabled:opacity-50 text-xs sm:text-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sign in with Google
                </button>
                
                <p className="mt-8 text-xs text-slate-400 font-medium">
                  Don't have a password yet? <Link to="/login" className="text-pink-500 font-bold hover:underline">Sign up here</Link>.
                </p>
              </motion.div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 bg-white/70 backdrop-blur-md rounded-[3rem] border border-pink-100 shadow-xl">
                <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-pink-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-400">No messages yet</h3>
                <p className="text-slate-400 font-medium">When you receive anonymous messages, they'll appear here.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 shadow-sm relative group overflow-hidden hover:shadow-[0_20px_40px_rgba(244,114,182,0.15)] transition-all"
                >
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-pink-50/30 rounded-full -translate-y-8 sm:-translate-y-12 translate-x-8 sm:translate-x-12 -z-0"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                      <div className="bg-pink-50 text-pink-500 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black tracking-widest uppercase">Anonymous</div>
                      <span className="text-slate-300 text-[9px] sm:text-xs font-medium">
                        {msg.createdAt ? new Date(msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : msg.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    
                    <p className="text-base sm:text-xl font-medium text-slate-700 leading-relaxed mb-6 italic">"{msg.text}"</p>
                    
                    {msg.isReported ? (
                      <div className="flex justify-end">
                        <div className="flex items-center gap-2 text-rose-500 font-bold text-xs sm:text-sm bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>REPORTED</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleReport(msg)}
                          disabled={reportingMsgId === msg.id}
                          className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm hover:text-rose-600 transition-all disabled:opacity-50"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>{reportingMsgId === msg.id ? 'REPORTING...' : 'REPORT MESSAGE'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default Dashboard;
