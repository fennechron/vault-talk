import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, UserX, MessageSquare, Clock, ShieldCheck, ChevronRight, Lock, Eye, Trash2, RefreshCw, ShieldAlert, ShieldOff } from 'lucide-react';
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

    const handleDeleteMessage = async (recipientId, messageId, reportId) => {
        if (!window.confirm("Are you sure you want to delete this message from the receiver's inbox? This action cannot be undone.")) return;
        try {
            await api.deleteMessage(password, recipientId, messageId, reportId);
            alert("Message deleted and report updated.");
            // For now, let's keep the report but maybe show a visual indicator.
            // Actually, usually deleting the message is the action taken on the report.
            // Let's just alert success for now and maybe refresh reports?
            alert("Message deleted successfully.");

            // Re-fetch reports to see the latest state (if the report is removed or updated)
            const fetchedReports = await api.getAdminReports(password);
            setReports(fetchedReports);
        } catch (err) {
            alert("Failed to delete message: " + err.message);
        }
    };

    const handleDeleteAllMessages = async () => {
        const confirmMsg = "Are you sure you want to delete ALL reported messages from receivers' inboxes and clear all reports? This action is IRREVERSIBLE and will affect all listed reports.";
        if (!window.confirm(confirmMsg)) return;

        try {
            setLoading(true);
            const result = await api.deleteAllReportedMessages(password);
            alert(result.message || "All reported messages deleted and reports cleared.");

            // Re-fetch reports (should be empty now)
            const fetchedReports = await api.getAdminReports(password);
            setReports(fetchedReports);
        } catch (err) {
            alert("Failed to clear all reports: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-950/80 border-2 border-red-900/30 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden backdrop-blur-xl"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none"></div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-red-950/20 rounded-2xl flex items-center justify-center border border-red-900/30 mb-4 shadow-xl shadow-red-900/10 rotate-3">
                            <Shield className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tightest uppercase italic">Admin Login</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Please enter administrator password</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-900/50 w-5 h-5 pointer-events-none" />
                            <input
                                type="password"
                                placeholder="Admin Password"
                                className="w-full bg-slate-900/50 border border-red-900/20 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-red-900/10 transition-all font-black placeholder:text-slate-800 text-white"
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
                                    className="text-red-600 text-[10px] font-black bg-red-950/20 py-3 px-4 rounded-xl border border-red-900/20 uppercase tracking-tighter"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full accent-gradient py-4 rounded-xl font-black text-white hover:opacity-95 transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 uppercase tracking-widest shimmer"
                        >
                            {loading ? 'AUTHENTICATING...' : 'LOG IN'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-950 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tightest uppercase italic">Moderation <span className="text-red-600">Dashboard</span></h1>
                    <p className="text-slate-500 font-bold text-xs tracking-tight">Moderating {reports.length} reported messages</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-red-950/40 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-900/30 flex items-center gap-2 shadow-lg shadow-red-900/10">
                        <ShieldCheck className="w-4 h-4" />
                        ADMIN_ACTIVE
                    </div>
                    {reports.length > 0 && (
                        <button
                            onClick={handleDeleteAllMessages}
                            disabled={loading}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-900/40 hover:bg-red-700 transition-all disabled:opacity-50"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Delete All Reported
                        </button>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 bg-slate-900 border border-red-900/30 rounded-xl hover:bg-red-950/20 text-red-600 transition-all shadow-xl"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {reports.length === 0 ? (
                <div className="text-center py-24 bg-slate-900/50 border border-red-900/20 rounded-[3rem] shadow-xl">
                    <div className="w-20 h-20 bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/30">
                        <ShieldCheck className="w-10 h-10 text-red-900" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-700 uppercase tracking-widest italic">NO REPORTS</h3>
                    <p className="text-slate-500 font-bold text-[10px] tracking-tight mt-2">No messages have been reported yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reports.map((report, index) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-950 border border-red-900/20 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row gap-8 relative overflow-hidden group hover:border-red-600/30 transition-all hover:bg-red-950/10"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="px-3 py-1 bg-red-950/40 text-red-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-red-900/40">
                                        Reported Message
                                    </div>
                                    {report.isMessageDeleted && (
                                        <div className="px-3 py-1 bg-slate-900 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-slate-800 flex items-center gap-1">
                                            <ShieldOff className="w-3 h-3" />
                                            Deleted
                                        </div>
                                    )}
                                    <span className="text-slate-600 text-[10px] font-bold tracking-tight">
                                        {report.reportedAt ? new Date(report.reportedAt.seconds * 1000).toLocaleString() : 'N/A'}
                                    </span>
                                </div>

                                <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/10 mb-6 italic relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl"></div>
                                    <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-red-900/20" />
                                    <p className="text-lg font-medium text-slate-200 leading-relaxed tracking-tight italic">"{report.text}"</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-tight">
                                    <div className="bg-slate-900 text-slate-500 px-4 py-2 rounded-xl border border-red-900/10">
                                        RECIPIENT: <span className="text-slate-300">{report.recipientId}</span>
                                    </div>
                                    <div className="bg-slate-900 text-slate-500 px-4 py-2 rounded-xl border border-red-900/10">
                                        SENDER: <span className="text-red-600">{report.senderId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:w-72 lg:border-l border-red-900/20 lg:pl-8 flex flex-col justify-center">
                                <div className="mb-6">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">User Status</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Warnings</span>
                                            <span className={`px-2 py-0.5 rounded-lg ${infractions[report.senderId]?.warnings > 0 ? 'bg-amber-950/40 text-amber-500 border border-amber-900/30' : 'bg-slate-900 text-slate-700'}`}>
                                                {infractions[report.senderId]?.warnings || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Account Status</span>
                                            <span className={`px-2 py-0.5 rounded-lg ${infractions[report.senderId]?.isBlocked ? 'bg-red-950/40 text-red-600 border border-red-600/30' : 'bg-emerald-950/40 text-emerald-600 border border-emerald-900/30'}`}>
                                                {infractions[report.senderId]?.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => handleWarning(report.senderId)}
                                        disabled={report.senderId === 'anonymous' || infractions[report.senderId]?.isBlocked}
                                        className="flex items-center justify-center gap-2 bg-amber-950/20 text-amber-600 border border-amber-900/30 py-3 rounded-xl font-bold text-[10px] tracking-wider hover:bg-amber-900/20 transition-all disabled:opacity-10 shadow-sm"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Issue Warning
                                    </button>
                                    <button
                                        onClick={() => handleBlock(report.senderId)}
                                        disabled={report.senderId === 'anonymous' || infractions[report.senderId]?.isBlocked}
                                        className="flex items-center justify-center gap-2 bg-red-950/20 text-red-600 border border-red-900/30 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-10 shadow-lg shadow-red-900/10"
                                    >
                                        <UserX className="w-4 h-4" />
                                        Block User
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMessage(report.recipientId, report.messageId, report.id)}
                                        disabled={report.isMessageDeleted}
                                        className="flex items-center justify-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-lg disabled:opacity-20 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 disabled:hover:border-slate-800"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {report.isMessageDeleted ? 'Message Deleted' : 'Delete for Receiver'}
                                    </button>
                                </div>
                                {report.senderId === 'anonymous' && (
                                    <p className="text-[9px] text-red-900 font-black mt-4 text-center italic uppercase leading-tight tracking-tighter opacity-70">
                                        ANONYMOUS SENDER. RESTRICTED MODERATION.
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
