import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, reload, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, LogOut, Search, Inbox as InboxIcon, Users, MessageSquare, X, CheckCircle, ArrowRight, Home, Lock, Mail, Activity, AlertTriangle, Zap, Bell, RefreshCw, UserPlus, Skull, ShieldAlert, Terminal, Plus } from 'lucide-react';
import { api } from '../utils/api';
import CryptoJS from 'crypto-js';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'inbox'
  const [searchTerm, setSearchTerm] = useState('');
  const [reportingMsgId, setReportingMsgId] = useState(null);
  const [likingMsgId, setLikingMsgId] = useState(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [isEmojiPickerExpanded, setIsEmojiPickerExpanded] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNoNotifToast, setShowNoNotifToast] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [infractionData, setInfractionData] = useState({ warnings: 0, isBlocked: false });
  const navigate = useNavigate();

  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authSuccess, setAuthSuccess] = useState('');

  const [currentUserData, setCurrentUserData] = useState(null);
  const currentUserEmail = auth.currentUser?.email;
  const unreadCount = messages.filter(m => !m.viewed).length;

  // Fetch current user's Firestore data for the header name
  useEffect(() => {
    if (currentUserEmail) {
      const unsub = onSnapshot(doc(db, 'users', currentUserEmail), (doc) => {
        if (doc.exists()) {
          setCurrentUserData(doc.data());
        }
      });
      return () => unsub();
    }
  }, [currentUserEmail]);

  // Check for infractions (warnings/blocks)
  useEffect(() => {
    const checkInfractions = async () => {
      const id = auth.currentUser?.email || localStorage.getItem('whisp_temp_id');
      if (id) {
        try {
          const data = await api.getMyInfractions(id);
          setInfractionData(data);
          if (data.isBlocked) {
            localStorage.setItem('whisp_blocked_status', 'true');
          } else {
            localStorage.removeItem('whisp_blocked_status');
          }
        } catch (error) {
          console.error("Failed to fetch infractions:", error);
        }
      }
    };
    checkInfractions();
    // Re-check periodically or on refocus? Let's just do it on mount/entry
  }, [auth.currentUser, activeTab]);

  // Check for sender feedback notifications
  useEffect(() => {
    const checkNotifications = async () => {
      const id = auth.currentUser?.email || localStorage.getItem('whisp_temp_id');
      if (id) {
        try {
          const notifs = await api.getNotifications(id);
          setNotifications(notifs);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      }
    };
    checkNotifications();
  }, [auth.currentUser]);

  const handleClearNotifications = async () => {
    const id = auth.currentUser?.email || localStorage.getItem('whisp_temp_id');
    if (id) {
      try {
        await api.clearNotifications(id);
        setNotifications([]);
        if (!auth.currentUser) {
          localStorage.removeItem('whisp_temp_id');
        }
      } catch (error) {
        console.error("Failed to clear notifications:", error);
      }
    }
  };

  // Mark all as read when Inbox tab is opened
  useEffect(() => {
    if (activeTab === 'inbox' && unreadCount > 0 && currentUserEmail) {
      const markAsRead = async () => {
        try {
          await api.markAllAsRead(currentUserEmail);
          setMessages(prev => prev.map(m => ({ ...m, viewed: true })));
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      };
      markAsRead();
    }
  }, [activeTab, unreadCount, currentUserEmail]);

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
          const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'whisp-default-secret-key';
          const decryptedMsgs = msgs.map(msg => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.text, encryptionKey);
              const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
              return {
                ...msg,
                text: decryptedText || msg.text,
                viewed: msg.viewed ?? false,
                isLiked: msg.isLiked ?? false,
                reaction: msg.reaction ?? null
              };
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

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthenticating(true);

    if (!loginEmail.toLowerCase().endsWith('@ceconline.edu')) {
      setAuthError('Only @ceconline.edu emails are allowed.');
      setIsAuthenticating(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!signupName.trim()) {
          setAuthError('Full name is required for sign up.');
          setIsAuthenticating(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        const user = userCredential.user;

        // Update Firebase Auth Profile
        await updateProfile(user, { displayName: signupName });

        // Send Verification Email
        await sendEmailVerification(user);

        // Save to Firestore 'users' collection using EMAIL
        await setDoc(doc(db, 'users', loginEmail), {
          name: signupName,
          email: loginEmail,
          id: loginEmail,
          createdAt: new Date(),
          lastLogin: new Date()
        });

        setAuthSuccess('Account created! A verification email has been sent to ' + loginEmail + '. Please verify before viewing your inbox.');
        setIsSignUp(false); // Switch to login mode
      } else {
        const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        const loggedInUser = result.user;

        // Update lastLogin
        await setDoc(doc(db, 'users', loggedInUser.email), {
          lastLogin: new Date()
        }, { merge: true });
      }
      setIsAuthenticating(false);
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. If you haven\'t set a password yet, please sign up first.');
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
      const userRef = doc(db, 'users', loggedInUser.email);
      const userSnap = await getDoc(userRef);

      const userData = {
        email: loggedInUser.email,
        id: loggedInUser.email,
        photoURL: loggedInUser.photoURL,
        lastLogin: new Date()
      };

      // Only set name if it's a new user
      if (!userSnap.exists()) {
        userData.name = loggedInUser.displayName;
      }

      await setDoc(userRef, userData, { merge: true });

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

  const handleLike = async (msg) => {
    if (likingMsgId) return;
    setLikingMsgId(msg.id);
    try {
      await api.likeMessage(auth.currentUser?.email, msg.id);
      setMessages(prev => prev.map(m =>
        m.id === msg.id ? { ...m, isLiked: true, isAnimating: true } : m
      ));
      // Reset animating state after animation completes
      setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === msg.id ? { ...m, isAnimating: false } : m
        ));
      }, 1000);
    } catch (error) {
      console.error("Error with appreciation:", error);
    } finally {
      setLikingMsgId(null);
    }
  };

  const handleReact = async (msg, emoji) => {
    try {
      await api.reactToMessage(auth.currentUser?.email, msg.id, emoji);
      setMessages(prev => prev.map(m =>
        m.id === msg.id ? { ...m, reaction: emoji } : m
      ));
      setEmojiPickerMsgId(null);
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setResendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendSuccess('Verification email sent! Please check your inbox.');
      setTimeout(() => setResendSuccess(''), 5000);
    } catch (error) {
      alert("Error sending verification email: " + error.message);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!auth.currentUser) return;
    setRefreshing(true);
    try {
      await reload(auth.currentUser);
      // After reload, the auth state in the SDK might not update immediately in the component
      // but auth.currentUser.emailVerified will be updated.
      if (auth.currentUser.emailVerified) {
        // Force a re-render or just let the component naturally reactive to auth changes
        // Actually auth changes don't always trigger re-render unless we use an observer or state
        // Let's just navigate to same page or window reload to be safe and simple
        window.location.reload();
      } else {
        alert("Email is still not verified. Please check your inbox and click the verification link.");
      }
    } catch (error) {
      console.error("Error reloading user:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredUsers = users
    .filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Blocked Overlay */}
      <AnimatePresence>
        {infractionData.isBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-950 border-2 border-red-900/40 p-8 sm:p-12 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden text-center backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 opacity-20 blur-3xl"></div>
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-red-950/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-900/30 shadow-xl shimmer">
                <Skull className="text-red-600 w-10 h-10 sm:w-16 sm:h-16" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black mb-6 text-white tracking-tight uppercase italic">Account Blocked</h2>
              <p className="text-slate-400 text-lg sm:text-xl font-black mb-10 leading-relaxed uppercase tracking-tighter">
                Your account has been blocked due to multiple violations of our <span className="text-red-600 font-black decoration-red-900 underline-offset-4 underline tracking-widest">COMMUNITY RULES</span>.
              </p>
              <div className="bg-red-900/20 border border-red-900/40 p-4 rounded-2xl mb-8">
                <p className="text-red-500 text-xs font-black uppercase tracking-[0.3em]">Permanent Account Block</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-white border-2 border-slate-100 py-4 rounded-2xl font-black text-slate-800 hover:bg-slate-50 transition-all text-sm uppercase tracking-widest shadow-lg"
              >
                Return to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Banner */}
      <AnimatePresence>
        {infractionData.warnings > 0 && !infractionData.isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-950/20 border-2 border-red-900/40 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-red-900/10"
          >
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-950">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-red-500 text-xs uppercase tracking-widest">Warning</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-tight">
                Warning count: <span className="text-red-500 px-2 py-0.5 bg-red-950/40 rounded-md mx-0.5 border border-red-900/20">{infractionData.warnings}</span>.
                Further violations will result in <span className="text-red-500 underline underline-offset-2">Account Suspension</span>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Success Notification */}
      <AnimatePresence>
        {showReportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-black uppercase text-xs sm:text-sm tracking-widest border border-red-900/30"
          >
            <AlertTriangle className="w-5 h-5" />
            Message Reported Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-row justify-between items-center gap-4 mb-6 sm:mb-8 text-left">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/" className="text-3xl sm:text-4xl font-black text-red-600 inline-block hover:opacity-80 transition-opacity tracking-tighter uppercase italic">Whisp</Link>
          <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-1">User: {currentUserData?.name || auth.currentUser?.displayName || 'Anonymous'}</p>
        </motion.div>

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 sm:p-3 bg-slate-900 border border-red-900/20 rounded-xl sm:rounded-2xl hover:bg-red-950/20 text-red-600 transition-all shadow-sm flex items-center justify-center"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {(auth.currentUser || localStorage.getItem('whisp_temp_id')) && (
            <button
              onClick={() => {
                if (notifications.length > 0) {
                  const element = document.getElementById('feedback-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setShowNoNotifToast(true);
                  setTimeout(() => setShowNoNotifToast(false), 3000);
                }
              }}
              className="p-2.5 sm:p-3 bg-slate-900 border border-red-900/20 rounded-xl sm:rounded-2xl hover:bg-red-950/20 text-red-600 transition-all shadow-sm flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-950 font-black animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>
          )}

          {auth.currentUser ? (
            <button
              onClick={handleLogout}
              className="p-2.5 sm:p-3 bg-slate-900 border border-red-900/20 rounded-xl sm:rounded-2xl hover:bg-red-950/20 text-red-600 transition-all shadow-sm flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="p-2.5 sm:p-3 bg-slate-900 border border-red-900/20 rounded-xl sm:rounded-2xl hover:bg-red-950/20 text-red-600 transition-all shadow-sm flex items-center justify-center"
            >
              <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900 border border-red-900/20 rounded-xl sm:rounded-[2rem] mb-6 sm:mb-8">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-red-600 text-white shadow-xl shadow-red-900/20' : 'text-slate-500 hover:text-red-400'}`}
        >
          <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-red-600 text-white shadow-xl shadow-red-900/20' : 'text-slate-500 hover:text-red-400'}`}
        >
          <InboxIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          Messages
          {auth.currentUser && unreadCount > 0 && (
            <span className="bg-white text-red-600 text-[8px] sm:text-[10px] w-3.5 h-3.5 sm:w-5 sm:h-5 flex items-center justify-center rounded-full font-black">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* No Notifications Toast */}
      <AnimatePresence>
        {showNoNotifToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md"
          >
            <Bell className="w-5 h-5 text-red-600" />
            <span className="font-bold text-sm tracking-wide uppercase">No new likes or reactions yet!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications / Feedback */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
            id="feedback-section"
          >
            <div className="bg-slate-950/80 backdrop-blur-md border-2 border-red-900/30 rounded-3xl p-6 shadow-xl relative group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black">!</div>
                  <h3 className="font-black text-white uppercase tracking-widest text-xs sm:text-sm">Notifications</h3>
                </div>
                <button
                  onClick={handleClearNotifications}
                  className="text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {notifications.map((notif) => {
                  let displayText = notif.text;
                  try {
                    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'whisp-default-secret-key';
                    const bytes = CryptoJS.AES.decrypt(notif.text, encryptionKey);
                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                    if (decrypted) displayText = decrypted;
                  } catch (e) { }

                  return (
                    <div key={notif.id} className="flex items-center gap-4 bg-red-950/20 p-3 rounded-2xl border border-red-900/30">
                      <div className="text-2xl text-red-500">
                        {notif.type === 'like' ? <Zap className="w-6 h-6 fill-red-600" /> : notif.reaction}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-300 font-black text-[10px] sm:text-xs uppercase tracking-tighter">
                          Someone {notif.type === 'like' ? 'liked' : 'reacted to'} your message.
                        </p>
                        <p className="text-red-900 text-[11px] font-bold italic truncate max-w-[200px] mt-0.5">
                          "{displayText}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-red-900 text-[9px] font-black uppercase tracking-[0.2em] mt-4 text-center">Log out to clear notifications</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'members' ? (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="relative mb-6 sm:mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for users..."
                className="w-full bg-slate-900 border border-red-900/30 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/10 transition-all text-base sm:text-lg font-black uppercase placeholder:text-slate-700 text-white"
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
                  whileHover={{ scale: 1.03, y: -4, rotate: index % 2 === 0 ? 0.5 : -0.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-morphism rounded-2xl sm:rounded-3xl p-4 sm:p-5 cursor-pointer group hover:border-red-600 transition-all border border-red-900/20 shadow-sm bg-slate-900/60 hover:shadow-[0_20px_40px_rgba(153,27,27,0.15)]"
                  onClick={() => navigate(`/message/${user.id}`)}
                >
                  <div className="flex flex-row sm:flex-col items-center sm:text-center gap-4 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-red-950/40 flex items-center justify-center border border-red-900/30 text-xl sm:text-2xl font-black text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col sm:items-center overflow-hidden flex-1">
                      <h3 className="font-bold text-slate-200 group-hover:text-red-500 transition-colors truncate w-full text-sm sm:text-base tracking-tight italic">{user.name}</h3>
                      <div className="bg-red-900/20 text-red-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mt-1 border border-red-900/40">Send Message</div>
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
                className="text-center py-16 sm:py-24 bg-slate-950/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-red-900/30 shadow-2xl max-w-xl mx-auto relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-900/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="w-20 h-20 bg-red-950/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/20 rotate-3 border border-red-900/30">
                  {isSignUp ? <UserPlus className="w-10 h-10 text-red-600" /> : <Lock className="w-10 h-10 text-red-600" />}
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tightest uppercase italic">
                  {isSignUp ? 'CREATE ACCOUNT' : 'PRIVATE INBOX'}
                </h3>
                <p className="text-slate-500 font-black mb-8 px-6 text-[10px] sm:text-xs uppercase tracking-widest">
                  {isSignUp ? 'Sign up to start messaging.' : 'Log in with your '}
                  {!isSignUp && <strong className="text-red-600">@ceconline.edu</strong>}
                  {!isSignUp && ' account to see your messages.'}
                </p>

                <AnimatePresence>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 px-6 text-red-600 text-xs font-black bg-red-950/20 py-3 rounded-xl mx-6 sm:mx-12 border border-red-900/40 uppercase tracking-tighter"
                    >
                      {authError}
                    </motion.div>
                  )}
                  {authSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 px-6 text-emerald-500 text-xs font-black bg-emerald-950/20 py-3 rounded-xl mx-6 sm:mx-12 border border-emerald-900/40 uppercase tracking-tighter"
                    >
                      {authSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleEmailAuth} className="w-full px-6 sm:px-12 flex flex-col gap-3 sm:gap-4 mb-6">
                  {isSignUp && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Identification Name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required={isSignUp}
                        className="w-full bg-slate-900/50 border border-red-900/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/10 transition-all font-black placeholder:text-slate-700 text-sm sm:text-base text-white"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="Protocol Address (@ceconline.edu)"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full bg-slate-900/50 border border-red-900/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/10 transition-all font-black placeholder:text-slate-700 text-sm sm:text-base text-white"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Protocol Key"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-slate-900/50 border border-red-900/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/10 transition-all font-black placeholder:text-slate-700 text-sm sm:text-base text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full accent-gradient py-3.5 mt-2 rounded-xl font-black text-white hover:opacity-90 transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2 uppercase tracking-widest shimmer"
                  >
                    {isAuthenticating ? 'AUTHENTICATING...' : (isSignUp ? 'INITIALIZE UNIT' : 'ESTABLISH LINKS')}
                  </button>
                </form>

                <div className="flex items-center gap-4 px-6 sm:px-12 mb-6 opacity-40">
                  <div className="h-px bg-red-900/50 flex-1"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">OR</span>
                  <div className="h-px bg-red-900/50 flex-1"></div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  type="button"
                  className="mx-auto bg-slate-900 border-2 border-red-900/20 py-3 px-6 sm:px-8 rounded-xl font-black text-slate-400 hover:bg-red-950/20 hover:border-red-900/40 transition-all flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 disabled:opacity-50 text-[10px] sm:text-xs uppercase tracking-widest group"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 sm:w-5 sm:h-5 grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all" />
                  Sign in with Google
                </button>

                <p className="mt-8 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                  {isSignUp ? 'ALREADY HAVE AN ACCOUNT?' : "NEW TO WHISP?"}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="ml-2 text-red-600 font-black hover:underline underline-offset-4 decoration-red-900/50"
                  >
                    {isSignUp ? 'SIGN IN' : 'SIGN UP'}
                  </button>
                </p>
              </motion.div>
            ) : !auth.currentUser.emailVerified ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 sm:py-24 bg-slate-950/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-red-900/30 shadow-2xl max-w-xl mx-auto relative overflow-hidden px-6"
              >
                <div className="w-20 h-20 bg-red-950/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/20 rotate-3 border border-red-900/30">
                  <Activity className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tightest uppercase italic">VERIFICATION REQUIRED</h3>
                <p className="text-slate-500 font-black mb-8 text-[10px] sm:text-xs uppercase tracking-widest leading-relaxed">
                  Verification email sent to <strong className="text-red-600">{auth.currentUser.email}</strong>.
                  Check your email to verify your account.
                </p>

                <AnimatePresence>
                  {resendSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 text-emerald-500 text-xs font-black bg-emerald-950/20 py-3 rounded-xl border border-emerald-900/40 uppercase tracking-tighter"
                    >
                      {resendSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="w-full accent-gradient py-4 rounded-xl font-black text-white hover:opacity-90 transition-all shadow-xl shadow-red-900/30 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest shimmer"
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'REFRESHING...' : "REFRESH STATUS"}
                  </button>

                  <button
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="w-full bg-slate-900 border-2 border-red-900/20 py-3 rounded-xl font-black text-slate-400 hover:bg-red-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] uppercase tracking-widest"
                  >
                    <Send className="w-4 h-4 text-red-600" />
                    {resendingEmail ? 'SENDING...' : 'RESEND EMAIL'}
                  </button>

                  <button
                    onClick={() => signOut(auth)}
                    className="mt-4 text-slate-600 hover:text-red-500 font-black transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]"
                  >
                    <LogOut className="w-4 h-4" />
                    LOG OUT
                  </button>
                </div>
              </motion.div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-red-900/30 rounded-[3rem] shadow-xl">
                <div className="w-20 h-20 bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/30">
                  <Skull className="w-10 h-10 text-red-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-700 uppercase tracking-widest italic">EMPTY</h3>
                <p className="text-slate-500 font-black uppercase text-[10px] sm:text-xs tracking-widest mt-2">No messages found in your inbox.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`relative transition-all duration-300 ${emojiPickerMsgId === msg.id ? 'z-[110]' : 'z-10'
                    }`}
                >
                  <div className="bg-slate-950/60 backdrop-blur-md border border-red-900/20 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-red-900/10 rounded-full -translate-y-8 sm:-translate-y-12 translate-x-8 sm:translate-x-12 -z-0"></div>

                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <div className="bg-red-950/40 text-red-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black tracking-widest uppercase border border-red-900/30">Anonymous Message</div>
                        <span className="text-slate-600 text-[9px] sm:text-xs font-black uppercase tracking-widest">
                          {msg.createdAt ? new Date(msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : msg.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>

                      <p className="text-base sm:text-lg font-medium text-slate-200 leading-relaxed mb-6 italic tracking-normal [word-spacing:0.11em]">"{msg.text}"</p>


                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onMouseDown={() => {
                                const timer = setTimeout(() => {
                                  setEmojiPickerMsgId(msg.id);
                                }, 500);
                                setLongPressTimer(timer);
                              }}
                              onMouseUp={() => {
                                if (longPressTimer) {
                                  clearTimeout(longPressTimer);
                                  setLongPressTimer(null);
                                  if (!emojiPickerMsgId) handleLike(msg);
                                }
                              }}
                              onMouseLeave={() => {
                                if (longPressTimer) {
                                  clearTimeout(longPressTimer);
                                  setLongPressTimer(null);
                                }
                              }}
                              onTouchStart={() => {
                                const timer = setTimeout(() => {
                                  setEmojiPickerMsgId(msg.id);
                                }, 500);
                                setLongPressTimer(timer);
                              }}
                              onTouchEnd={() => {
                                if (longPressTimer) {
                                  clearTimeout(longPressTimer);
                                  setLongPressTimer(null);
                                  if (!emojiPickerMsgId) handleLike(msg);
                                }
                              }}
                              disabled={likingMsgId === msg.id}
                              className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all relative overflow-visible ${msg.isLiked ? 'text-red-600 bg-red-950/20 shadow-[0_0_20px_rgba(153,27,27,0.3)]' : 'text-slate-600 hover:text-red-500 hover:bg-red-950/10'}`}
                            >
                              <motion.div
                                animate={msg.isAnimating ? {
                                  y: [0, -120, 0],
                                  x: [0, 60, -20, 0],
                                  scale: [1, 2.8, 1],
                                  rotate: [0, 180, 360, 0],
                                  opacity: [1, 0.8, 1]
                                } : {}}
                                transition={{
                                  duration: 1,
                                  times: [0, 0.4, 0.8, 1],
                                  ease: "easeInOut"
                                }}
                                className="relative z-20 flex items-center justify-center min-w-[1.5rem]"
                              >
                                {msg.reaction ? (
                                  <span className="text-2xl leading-none">{msg.reaction}</span>
                                ) : (
                                  <Zap className={`w-6 h-6 ${msg.isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                                )}
                              </motion.div>

                              {/* Subtle background pulse when liked/reacted */}
                              {(msg.isLiked || msg.reaction) && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0.5 }}
                                  animate={{ scale: 1.5, opacity: 0 }}
                                  className="absolute inset-0 bg-red-600 rounded-2xl -z-0"
                                />
                              )}
                            </motion.button>

                            {/* Emoji Picker Overlay */}
                            <AnimatePresence>
                              {emojiPickerMsgId === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
                                  animate={{ opacity: 1, y: -12, scale: 1, x: '-50%' }}
                                  exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
                                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                                  className={`absolute bottom-full left-52 mb-4 bg-slate-900/95 border border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-1 z-[100] items-center backdrop-blur-2xl transition-all duration-500 whitespace-nowrap min-w-max ${isEmojiPickerExpanded ? 'rounded-[2.5rem] p-3' : 'rounded-full px-4 py-2'
                                    }`}
                                >
                                  {/* Arrow Tail */}
                                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>

                                  <div className="flex items-center gap-1">
                                    {['❤️', '😂', '👍', '🔥', '😍', '😮', '🙂', '🤔'].map((emoji) => (
                                      <motion.button
                                        key={emoji}
                                        whileHover={{ scale: 1.5, y: -8 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReact(msg, emoji);
                                          setIsEmojiPickerExpanded(false);
                                        }}
                                        className="text-2xl p-1 hover:bg-slate-800/40 rounded-full transition-all duration-200"
                                      >
                                        {emoji}
                                      </motion.button>
                                    ))}
                                    {!isEmojiPickerExpanded && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsEmojiPickerExpanded(true);
                                        }}
                                        className="p-1.5 bg-red-950/20 text-red-500 rounded-lg hover:bg-red-950/40 transition-colors border border-red-900/20 ml-1"
                                      >
                                        <Plus className="w-5 h-5" />
                                      </motion.button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEmojiPickerMsgId(null);
                                        setIsEmojiPickerExpanded(false);
                                      }}
                                      className="ml-1 p-1 text-slate-600 hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {isEmojiPickerExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="flex items-center gap-1 pb-1"
                                    >
                                      {['😡', '😤', '🤬', '😎', '🙏', '💯', '😏', '🤫'].map((emoji) => (
                                        <motion.button
                                          key={emoji}
                                          whileHover={{ scale: 1.5, y: -8 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReact(msg, emoji);
                                            setIsEmojiPickerExpanded(false);
                                          }}
                                          className="text-2xl p-1 hover:bg-slate-800/40 rounded-full transition-all duration-200"
                                        >
                                          {emoji}
                                        </motion.button>
                                      ))}
                                    </motion.div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {msg.isReported ? (
                          <div className="flex items-center gap-2 text-red-600 font-black text-[10px] sm:text-xs bg-red-950/40 px-3 py-1.5 rounded-full border border-red-900/40 shadow-sm uppercase tracking-widest">
                            <ShieldAlert className="w-4 h-4" />
                            <span>REPORTED</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleReport(msg)}
                            disabled={reportingMsgId === msg.id}
                            className="flex items-center gap-2 text-red-900 font-black text-[10px] sm:text-xs hover:text-red-500 transition-all disabled:opacity-50 uppercase tracking-widest"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>{reportingMsgId === msg.id ? 'REPORTING...' : 'REPORT MESSAGE'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div >
  );
};

export default Dashboard;
