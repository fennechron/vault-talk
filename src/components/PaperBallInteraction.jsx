import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hand, X, RefreshCw, Sparkles, MessageCircle, Navigation, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { api } from '../utils/api';
import { auth } from '../firebase';

const PaperPlaneInteraction = () => {
    const [mode, setMode] = useState(null); // 'throw', 'view', or null
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [caughtBall, setCaughtBall] = useState(null);
    const [isCatching, setIsCatching] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [interaction, setInteraction] = useState(null); // 'like', 'dislike', or null for current caught ball
    const [helpMode, setHelpMode] = useState(null); // 'throw', 'catch', or null

    const handleThrow = async () => {
        if (!text.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const senderId = auth.currentUser?.email || localStorage.getItem('whisp_temp_id') || 'anonymous';
            await api.throwPaperBall(text, senderId);

            setMode(null);
            setText('');
            setIsSubmitting(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            alert("Failed to throw: " + error.message);
            setIsSubmitting(false);
        }
    };

    const handleCatch = async () => {
        if (isCatching) return;
        setIsCatching(true);
        setCaughtBall(null);

        try {
            const ball = await api.catchPaperBall();
            setCaughtBall(ball);

            // Check localStorage for previous interaction
            const savedInteraction = localStorage.getItem(`whisp_ball_vote_${ball.id}`);
            setInteraction(savedInteraction);

            setMode('view');
        } catch (error) {
            if (error.message.includes('404')) {
                alert("The sky is empty! Throw a plane first.");
            } else {
                alert("Failed to catch: " + error.message);
            }
        } finally {
            setIsCatching(false);
        }
    };

    const handleLike = async () => {
        if (!caughtBall) return;

        try {
            if (interaction === 'like') {
                // Toggle off
                await api.unlikePaperBall(caughtBall.id);
                setInteraction(null);
                localStorage.removeItem(`whisp_ball_vote_${caughtBall.id}`);
            } else if (interaction === 'dislike') {
                // Switch from dislike to like
                await api.undislikePaperBall(caughtBall.id);
                await api.likePaperBall(caughtBall.id);
                setInteraction('like');
                localStorage.setItem(`whisp_ball_vote_${caughtBall.id}`, 'like');
            } else {
                // New like
                await api.likePaperBall(caughtBall.id);
                setInteraction('like');
                localStorage.setItem(`whisp_ball_vote_${caughtBall.id}`, 'like');
            }
        } catch (error) {
            console.error("Failed to toggle like:", error);
        }
    };

    const handleDislike = async () => {
        if (!caughtBall) return;

        try {
            if (interaction === 'dislike') {
                // Toggle off
                await api.undislikePaperBall(caughtBall.id);
                setInteraction(null);
                localStorage.removeItem(`whisp_ball_vote_${caughtBall.id}`);
            } else if (interaction === 'like') {
                // Switch from like to dislike
                await api.unlikePaperBall(caughtBall.id);
                await api.dislikePaperBall(caughtBall.id);
                setInteraction('dislike');
                localStorage.setItem(`whisp_ball_vote_${caughtBall.id}`, 'dislike');
            } else {
                // New dislike
                await api.dislikePaperBall(caughtBall.id);
                setInteraction('dislike');
                localStorage.setItem(`whisp_ball_vote_${caughtBall.id}`, 'dislike');
            }
        } catch (error) {
            console.error("Failed to toggle dislike:", error);
        }
    };

    return (
        <div className="relative mb-8 sm:mb-12">
            {/* Action Buttons */}
            <div className="flex flex-row gap-3 sm:gap-4 justify-center items-center">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode('throw')}
                    className="group relative bg-slate-900 border-2 border-red-900/30 p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-row sm:flex-col items-center gap-2 sm:gap-2 hover:border-red-600 transition-all w-full max-w-[140px] sm:w-48 shadow-lg shadow-red-900/5 overflow-hidden"
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setHelpMode('throw');
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-700 hover:text-red-500 transition-colors z-10"
                    >
                        <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-8 h-8 sm:w-16 sm:h-16 bg-red-950/20 rounded-lg sm:rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0">
                        <Navigation className="w-4 h-4 sm:w-8 sm:h-8 rotate-[-45deg] group-hover:rotate-0 transition-transform" />
                    </div>
                    <span className="font-black text-[8px] sm:text-xs uppercase tracking-widest text-slate-400 group-hover:text-white whitespace-nowrap">Throw Plane</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCatch}
                    disabled={isCatching}
                    className="group relative bg-slate-900 border-2 border-slate-800 p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-row sm:flex-col items-center gap-2 sm:gap-2 hover:border-red-600 transition-all w-full max-w-[140px] sm:w-48 shadow-lg overflow-hidden"
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setHelpMode('catch');
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-700 hover:text-red-500 transition-colors z-10"
                    >
                        <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={`w-8 h-8 sm:w-16 sm:h-16 ${isCatching ? 'bg-red-600' : 'bg-slate-800'} rounded-lg sm:rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0`}>
                        {isCatching ? (
                            <RefreshCw className="w-4 h-4 sm:w-8 sm:h-8 animate-spin text-white" />
                        ) : (
                            <Hand className="w-4 h-4 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform" />
                        )}
                    </div>
                    <span className="font-black text-[8px] sm:text-xs uppercase tracking-widest text-slate-400 group-hover:text-white whitespace-nowrap">
                        {isCatching ? 'Catching...' : 'Catch Plane'}
                    </span>
                </motion.button>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-[-4rem] left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl border border-red-500/30 flex items-center gap-2 z-50 whitespace-nowrap"
                    >
                        <Sparkles className="w-4 h-4" />
                        Plane sent successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Throw Modal */}
            <AnimatePresence>
                {mode === 'throw' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            layoutId="paper-plane-modal"
                            className="bg-slate-900 border-2 border-red-900/30 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setMode(null)}
                                className="absolute top-6 right-6 text-slate-500 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-red-950/40 rounded-xl flex items-center justify-center border border-red-900/30 text-red-600">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Write a Whisp</h3>
                                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-0.5">Send your plane into the sky</p>
                                </div>
                            </div>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What message should the wind carry?"
                                rows={4}
                                className="w-full bg-slate-950 border border-red-900/20 rounded-2xl p-5 mb-6 text-white focus:outline-none focus:ring-4 focus:ring-red-600/10 transition-all font-bold placeholder:text-slate-800 resize-none"
                            />

                            <button
                                onClick={handleThrow}
                                disabled={!text.trim() || isSubmitting}
                                className="w-full bg-red-600 py-4 rounded-2xl font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? 'SENDING...' : (
                                    <>
                                        <Navigation className="w-5 h-5 rotate-[-45deg]" />
                                        SEND PLANE
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Catch Result Modal */}
            <AnimatePresence>
                {mode === 'view' && caughtBall && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white p-8 sm:p-12 rounded-xl w-full max-w-lg shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(#f1f5f9 0px, #f1f5f9 1px, transparent 1px, transparent 24px)',
                                backgroundSize: '100% 24px'
                            }}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rotate-45 translate-x-12 -translate-y-12" />

                            <button
                                onClick={() => setMode(null)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="mb-8">
                                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-200">
                                    Caught a Message
                                </span>
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-3">
                                    Landed at: {caughtBall.createdAt?.seconds ? new Date(caughtBall.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                </p>
                            </div>

                            <div className="min-h-[120px] flex items-center justify-center text-center">
                                <p className="text-xl sm:text-2xl font-handwriting text-slate-800 leading-relaxed italic">
                                    "{caughtBall.text}"
                                </p>
                            </div>

                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleLike}
                                        className={`p-3 rounded-full transition-all border-2 ${interaction === 'like' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-600 hover:text-red-600'}`}
                                    >
                                        <ThumbsUp className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{caughtBall.likes + (interaction === 'like' ? 1 : 0)}</span>

                                    <button
                                        onClick={handleDislike}
                                        className={`p-3 rounded-full transition-all border-2 ${interaction === 'dislike' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-600 hover:text-red-600'} ml-2`}
                                    >
                                        <ThumbsDown className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{caughtBall.dislikes + (interaction === 'dislike' ? 1 : 0)}</span>
                                </div>

                                <div className="h-4 w-px bg-slate-100 hidden sm:block" />

                                <button
                                    onClick={handleCatch}
                                    className="bg-slate-900 text-white font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isCatching ? 'animate-spin' : ''}`} />
                                    CATCH ANOTHER
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Help Modal */}
            <AnimatePresence>
                {helpMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setHelpMode(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-900 border-2 border-red-900/30 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setHelpMode(null)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-red-950/40 rounded-xl flex items-center justify-center border border-red-900/30 text-red-600 mb-6">
                                <HelpCircle className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-4">
                                {helpMode === 'throw' ? 'What is Throwing?' : 'What is Catching?'}
                            </h3>

                            <p className="text-slate-400 text-sm font-bold leading-relaxed">
                                {helpMode === 'throw'
                                    ? "Share your thoughts, secrets, or kind words anonymously. Your message will be added to the pool for others to catch and read it. Your message will be anonymous."
                                    : "Discover messages from others. Catch a plane to read what others are thinking and interact with their whispers through likes or dislikes. Your message will be anonymous."}
                            </p>

                            <button
                                onClick={() => setHelpMode(null)}
                                className="w-full bg-slate-800 py-3 rounded-xl font-black text-white hover:text-red-500 transition-all text-[10px] uppercase tracking-widest border border-red-900/10 mt-8"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
        .font-handwriting {
          font-family: 'Caveat', cursive;
        }
      `}</style>
        </div>
    );
};

export default PaperPlaneInteraction;
