import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendMessage from './pages/SendMessage';
import Landing from './pages/Landing';
import FloatingBackground from './components/FloatingBackground';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
        <FloatingBackground />
        <div className="relative z-10 w-full h-full min-h-screen">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
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
