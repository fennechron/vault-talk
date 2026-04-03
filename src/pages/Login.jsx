import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, Github, User, ShieldAlert, CheckCircle, Terminal, Activity } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return email.toLowerCase().endsWith('@ceconline.edu');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please use your college ID (e.g., chn22csd301@ceconline.edu)');
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if user document exists using EMAIL, create if not
        const userRef = doc(db, 'users', email);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: user.displayName || email.split('@')[0].toUpperCase(),
            email: email,
            id: email,
            createdAt: new Date(),
            lastLogin: new Date()
          });
        }
        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Firebase Auth Profile
        await updateProfile(user, { displayName: name });

        // Send Verification Email
        await sendEmailVerification(user);

        // Save to Firestore 'users' collection using EMAIL
        await setDoc(doc(db, 'users', email), {
          name: name,
          email: email,
          id: email,
          createdAt: new Date(),
          lastLogin: new Date()
        });

        setSuccess('Account created! A verification email has been sent to ' + email + '. Please verify your email before logging in.If not found in inbox check spam folder');
        setIsLogin(true); // Switch to login mode
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!validateEmail(user.email)) {
        // Sign out if not a college email
        await auth.signOut();
        setError('Only @ceconline.edu emails are allowed.');
        return;
      }

      // Ensure Google users are also in the 'users' collection using EMAIL
      const userRef = doc(db, 'users', user.email);
      const userSnap = await getDoc(userRef);

      const userData = {
        email: user.email,
        id: user.email,
        photoURL: user.photoURL,
        lastLogin: new Date()
      };

      // Only set name if it's a new user
      if (!userSnap.exists()) {
        userData.name = user.displayName;
      }

      await setDoc(userRef, userData, { merge: true });

      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-slate-900/30 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
        className="glass-morphism p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl my-4 sm:my-0 relative z-10 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(153,27,27,0.25)] border-red-900/30"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 accent-gradient rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-4 sm:mb-6 shadow-2xl shadow-red-900/30 shimmer">
            <LogIn className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-center uppercase italic">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>
          <p className="text-slate-400 mt-2 sm:mt-3 text-center max-w-[280px] text-sm sm:text-base font-bold tracking-tight">
            {isLogin ? 'Welcome back. Please log in.' : 'Create an account to get started.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-950/20 border border-red-900/50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 tracking-tight"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 tracking-tight"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5" />
              <input
                type="text"
                placeholder="Your Name"
                className="w-full bg-slate-900/50 border border-red-900/20 rounded-lg sm:rounded-xl py-3 sm:py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/20 transition-all font-bold placeholder:text-slate-700 text-sm sm:text-base text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </motion.div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5" />
            <input
              type="email"
              placeholder="College Email (@ceconline.edu)"
              className="w-full bg-slate-900/50 border border-red-900/20 rounded-lg sm:rounded-xl py-3 sm:py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/20 transition-all font-bold placeholder:text-slate-700 text-sm sm:text-base text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-900/50 border border-red-900/20 rounded-lg sm:rounded-xl py-3 sm:py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/20 transition-all font-bold placeholder:text-slate-700 text-sm sm:text-base text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full accent-gradient py-3.5 sm:py-4 rounded-lg sm:rounded-xl font-black text-white hover:opacity-95 transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 text-base sm:text-lg uppercase tracking-widest shimmer"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-red-900/30">
          <div className="h-px bg-red-900/20 flex-1"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">OR</span>
          <div className="h-px bg-red-900/20 flex-1"></div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-slate-900 border border-red-900/20 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-black text-slate-300 hover:bg-red-950/20 transition-all flex items-center justify-center gap-3 shadow-sm text-xs sm:text-sm uppercase tracking-widest hover:text-red-500"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/node_modules/firebaseui/dist/rotate-google.png" alt="Google" className="w-5 h-5 grayscale opacity-50" />
          Sign in with Google
        </button>

        <p className="mt-6 sm:mt-8 text-center text-slate-500 text-[10px] sm:text-xs font-bold tracking-tight">
          {isLogin ? "New to Whisp?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-red-600 hover:text-red-500 transition-colors font-black underline decoration-red-900/40 underline-offset-4"
          >
            {isLogin ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </p>
      </motion.div>

      <footer className="sm:absolute bottom-8 left-0 right-0 text-center text-slate-600 text-[10px] sm:text-xs font-bold tracking-widest pb-8 sm:pb-0 uppercase">
        <p>© 2026 Whisp. Secured by <a href="https://fennechron.com" target="_blank" rel="noopener noreferrer" className="text-red-900/40 hover:text-red-600 font-bold transition-colors">FENNECHRON LABS</a>.</p>
      </footer>
    </div>
  );
};

export default Login;
