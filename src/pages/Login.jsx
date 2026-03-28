import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, Github, User, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return email.toLowerCase().endsWith('@ceconline.edu');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

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
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase Auth Profile
        await updateProfile(user, { displayName: name });
        
        // Save to Firestore 'users' collection using EMAIL
        await setDoc(doc(db, 'users', email), {
          name: name,
          email: email,
          id: email,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      }
      navigate('/dashboard');
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
      await setDoc(doc(db, 'users', user.email), {
        name: user.displayName,
        email: user.email,
        id: user.email,
        photoURL: user.photoURL,
        lastLogin: new Date()
      }, { merge: true });
      
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-300/30 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
        className="glass-morphism p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl my-4 sm:my-0 relative z-10 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(244,114,182,0.25)]"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 accent-gradient rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-4 sm:mb-6 shadow-2xl shadow-pink-200 shimmer">
            <LogIn className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 tracking-tight text-center">
            {isLogin ? 'Welcome Back' : 'Join the Class'}
          </h1>
          <p className="text-slate-500 mt-2 sm:mt-3 text-center max-w-[280px] text-sm sm:text-base font-medium">
            {isLogin ? 'Sign in to send secure anonymous messages' : 'Create your account to start sharing safely'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-50 border border-rose-100 text-rose-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 invisible" /> {/* Placeholder spacing */}
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full bg-pink-50/30 border border-pink-100 rounded-lg sm:rounded-xl py-3 sm:py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all font-light placeholder:text-pink-200 text-sm sm:text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </motion.div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-pink-50/30 border border-pink-100 rounded-lg sm:rounded-xl py-3 sm:py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all font-light placeholder:text-pink-200 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-pink-50/30 border border-pink-100 rounded-lg sm:rounded-xl py-3 sm:py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all font-light placeholder:text-pink-200 text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full accent-gradient py-3.5 sm:py-4 rounded-lg sm:rounded-xl font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2 text-base sm:text-lg"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-pink-200">
          <div className="h-px bg-pink-100 flex-1"></div>
          <span className="text-xs font-bold uppercase tracking-widest">OR</span>
          <div className="h-px bg-pink-100 flex-1"></div>
        </div>

        <button 
          onClick={signInWithGoogle}
          className="w-full bg-white border border-pink-100 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold text-slate-600 hover:bg-pink-50 transition-all flex items-center justify-center gap-3 shadow-sm text-sm sm:text-base"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/node_modules/firebaseui/dist/rotate-google.png" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="mt-6 sm:mt-8 text-center text-slate-400 text-xs sm:text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-pink-500 hover:text-pink-600 transition-colors font-bold"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </motion.div>

      <footer className="sm:absolute bottom-8 left-0 right-0 text-center text-slate-400 text-xs sm:text-sm font-medium pb-8 sm:pb-0">
        <p>© 2026 Whisp. Developed by <a href="https://fennechron.com" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-500 font-bold transition-colors">Fennechron Labs</a>.</p>
      </footer>
    </div>
  );
};

export default Login;
