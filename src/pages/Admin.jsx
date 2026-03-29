import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, UserX, MessageSquare, Clock, ShieldCheck, ChevronRight, Lock, Eye, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import FloatingBackground from '../components/FloatingBackground';

const Admin = () => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [infractions, setInfractions] = useState({}); // userId -> { warnings, isBlocked }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Small delay for feel
            await new Promise(resolve => setTimeout(resolve, 500));
            const fetchedReports = await api.getAdminReports(password);
            setReports(fetchedReports);
            setIsAuthenticated(true);

            // Fetch infractions for all reported users
            const userIds = [...new Set(fetchedReports.map(r => r.senderId))];
            const infractionData = {};
            for (const uid of userIds) {
                if (uid !== 'anonymous') {
                    const data = await api.getInfractions(password, uid);
                    infractionData[uid] = data;
                }
            }
            setInfractions(infractionData);
        } catch (err) {
            setError('Invalid admin password or access denied.');
        } finally {
            setLoading(false);
        }
    };

    const handleWarning = async (userId) => {
        if (!userId || userId === 'anonymous') return;
        try {
            await api.issueWarning(password, userId);
            const updatedData = await api.getInfractions(password, userId);
            setInfractions(prev => ({ ...prev, [userId]: updatedData }));
        } catch (err) {
            alert("Failed to issue warning: " + err.message);
        }
    };

    const handleBlock = async (userId) => {
        if (!userId || userId === 'anonymous') return;
        if (!window.confirm(`Are you sure you want to block ${userId}?`)) return;
        try {
            await api.blockUser(password, userId);
            const updatedData = await api.getInfractions(password, userId);
            setInfractions(prev => ({ ...prev, [userId]: updatedData }));
        } catch (err) {
            alert("Failed to block user: " + err.message);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-morphism p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 accent-gradient opacity-10 blur-3xl -mr-16 -mt-16 rounded-full"></div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100 mb-4 shadow-lg shimmer">
                            <Shield className="w-8 h-8 text-pink-500" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Access</h1>
                        <p className="text-slate-500 text-sm font-medium">Enter credentials to moderate Whisp</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 pointer-events-none" />
                            <input
                                type="password"
                                placeholder="Admin Password"
                                className="w-full bg-white border border-pink-100 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all font-light placeholder:text-pink-200"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-rose-500 text-xs font-bold bg-rose-50 py-3 px-4 rounded-xl border border-rose-100"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full accent-gradient py-4 rounded-xl font-black text-white hover:opacity-90 transition-all shadow-lg shadow-pink-200 disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Enter Dashboard'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Moderation <span className="text-pink-500">Center</span></h1>
                    <p className="text-slate-500 font-medium">Managing {reports.length} reported interactions</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Admin Authenticated
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 bg-white border border-pink-100 rounded-xl hover:bg-pink-50 text-pink-500 transition-all shadow-sm"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {reports.length === 0 ? (
                <div className="text-center py-24 bg-white/70 backdrop-blur-md rounded-[3rem] border border-pink-100 shadow-xl">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-pink-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400">Clear Skies</h3>
                    <p className="text-slate-400 font-medium">No messages currently reported for review.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reports.map((report, index) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row gap-8 relative overflow-hidden"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                        Reported Message
                                    </div>
                                    <span className="text-slate-400 text-xs font-medium">
                                        {report.reportedAt ? new Date(report.reportedAt.seconds * 1000).toLocaleString() : 'N/A'}
                                    </span>
                                </div>

                                <div className="bg-pink-50/30 p-6 rounded-2xl border border-pink-50 mb-6 italic relative">
                                    <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-pink-100" />
                                    <p className="text-xl font-medium text-slate-700 leading-relaxed">"{report.text}"</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
                                    <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl border border-slate-200">
                                        Recipient: <span className="text-slate-800">{report.recipientId}</span>
                                    </div>
                                    <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl border border-slate-200">
                                        Sender: <span className="text-pink-500">{report.senderId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:w-72 lg:border-l border-pink-100 lg:pl-8 flex flex-col justify-center">
                                <div className="mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account Status</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-500">Warnings</span>
                                            <span className={`px-2 py-0.5 rounded-lg ${infractions[report.senderId]?.warnings > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {infractions[report.senderId]?.warnings || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-500">Status</span>
                                            <span className={`px-2 py-0.5 rounded-lg ${infractions[report.senderId]?.isBlocked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {infractions[report.senderId]?.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => handleWarning(report.senderId)}
                                        disabled={report.senderId === 'anonymous' || infractions[report.senderId]?.isBlocked}
                                        className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 border border-amber-100 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-colors disabled:opacity-30"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Issue Warning
                                    </button>
                                    <button
                                        onClick={() => handleBlock(report.senderId)}
                                        disabled={report.senderId === 'anonymous' || infractions[report.senderId]?.isBlocked}
                                        className="flex items-center justify-center gap-2 bg-rose-50 text-rose-500 border border-rose-100 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-colors disabled:opacity-30"
                                    >
                                        <UserX className="w-4 h-4" />
                                        Disable Account
                                    </button>
                                </div>
                                {report.senderId === 'anonymous' && (
                                    <p className="text-[9px] text-slate-400 mt-4 text-center italic font-medium leading-tight">
                                        This user sent the message anonymously without a temporary session or login, moderation actions are limited.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Admin;
