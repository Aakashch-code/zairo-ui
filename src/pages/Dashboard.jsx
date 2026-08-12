import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, Receipt, ArrowUp, ArrowDown, Activity,
    PieChart as PieChartIcon, Landmark, Plus, Filter,
    Download, Search, X, Eye, Edit2, Trash2,
    ChevronLeft, ChevronRight, BarChart3, TrendingUp, Zap
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, RadialBarChart, RadialBar, Legend
} from 'recharts';

import {
    fetchTransactions, fetchNetPosition, exportTransactionsPdf,
    createTransaction, updateTransaction, deleteTransaction,
    fetchTransactionById, filterTransactions
} from '../service/api';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'];
const CURRENCIES = ['INR'];
const SOURCES = ['CASH', 'BANK_ACCOUNT', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NET_BANKING', 'AUTO_DEBIT', 'OTHER'];
const CATEGORIES = {
    INCOME:  ['SALARY','BUSINESS','FREELANCE','INVESTMENT','RENTAL','INTEREST','DIVIDEND','BONUS','GIFT','OTHER'],
    EXPENSE: ['FOOD','TRANSPORT','HOUSING','UTILITIES','HEALTHCARE','EDUCATION','ENTERTAINMENT','SHOPPING','SUBSCRIPTION','INSURANCE','TAX','EMI','TRAVEL','PERSONAL','OTHER']
};

const PALETTE = {
    emerald: '#00ff94',
    rose:    '#ff3356',
    gold:    '#ffcc00',
    indigo:  '#8b7fff',
    sky:     '#00d4ff',
    amber:   '#ff8c42',
    violet:  '#bf7fff',
};

const CHART_COLORS = [PALETTE.emerald, PALETTE.indigo, PALETTE.gold, PALETTE.rose, PALETTE.sky, PALETTE.amber, PALETTE.violet];

const safeNumber = (val) => { const n = Number(val); return isNaN(n) ? 0 : n; };
const fmt = (val) => {
    if (val === null || val === undefined) return '—';
    return `₹${safeNumber(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}>
            {label && <p style={{ color: '#666', fontSize: 11, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>}
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, display: 'inline-block' }} />
                    <span style={{ color: '#aaa', fontSize: 12 }}>{p.name}</span>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', marginLeft: 'auto', paddingLeft: 16 }}>{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

const StatCard = ({  title, value, color, sub, icon: Icon }) => (
    <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 28px 24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }}
         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${color}30`; }}
         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ padding: '10px', borderRadius: 12, background: `${color}15`, border: `1px solid ${color}25`, color }}><Icon size={18} /></div>
            {sub && <span style={{ fontSize: 11, color: sub > 0 ? PALETTE.emerald : PALETTE.rose, background: sub > 0 ? `${PALETTE.emerald}15` : `${PALETTE.rose}15`, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{sub > 0 ? '↑' : '↓'} {Math.abs(sub)}%</span>}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{title}</p>
        <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontFamily: '"DM Mono", monospace', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
);

const DonutChart = ({ data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                    <defs>{data.map((_, i) => (<radialGradient key={i} id={`dg${i}`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={1} /><stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.6} /></radialGradient>))}</defs>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={72} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>{data.map((_, i) => (<Cell key={i} fill={`url(#dg${i})`} />))}</Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -54%)', textAlign: 'center', pointerEvents: 'none' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</p>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, fontFamily: '"DM Mono", monospace', marginTop: 2 }}>{fmt(total)}</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 16 }}>
                {data.slice(0, 6).map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{d.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{((d.value / total) * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CashFlowChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
            <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PALETTE.emerald} stopOpacity={0.25} /><stop offset="100%" stopColor={PALETTE.emerald} stopOpacity={0} /></linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PALETTE.rose} stopOpacity={0.2} /><stop offset="100%" stopColor={PALETTE.rose} stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} dy={6} />
            <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Expense" stroke={PALETTE.rose} strokeWidth={2.5} fill="url(#gradExpense)" dot={false} activeDot={{ r: 5, fill: PALETTE.rose, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="Income" stroke={PALETTE.emerald} strokeWidth={2.5} fill="url(#gradIncome)" dot={false} activeDot={{ r: 5, fill: PALETTE.emerald, strokeWidth: 0 }} />
        </AreaChart>
    </ResponsiveContainer>
);

const CategoryBar = ({ name, value, total, color }) => {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />{name}</span>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(value)}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}80)`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${color}60` }} /></div>
        </div>
    );
};

const Modal = ({ open, onClose, title, icon: Icon, children, maxW = 480 }) => {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, width: '100%', maxWidth: maxW, boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 40px 120px rgba(0,0,0,1)', overflow: 'hidden', animation: 'modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)' }}>
                    <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.01em' }}>{Icon && <Icon size={16} style={{ color: PALETTE.emerald }} />} {title}</h2>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 10, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}><X size={18} /></button>
                </div>
                <div style={{ position: 'relative' }}>{children}</div>
            </div>
            <style>{`@keyframes modalEnter { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        </div>
    );
};

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, color: '#fff', padding: '12px 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 };

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────

export default function Dashboard() {
    const savedRolesRaw = localStorage.getItem('roles');
    const userRoles = savedRolesRaw ? JSON.parse(savedRolesRaw) : ['ROLE_VIEWER'];

    console.log("Roles successfully loaded into Dashboard:", userRoles);

    // --- RBAC Access Checks ---
    // ✅ 2. Check for both 'ORGANIZER' and 'ROLE_ORGANIZER' to be 100% safe
    const hasAnalyticalAccess = userRoles.some(role =>
        ['ORGANIZER', 'ROLE_ORGANIZER', 'ADMIN', 'ROLE_ADMIN', 'ANALYST', 'ROLE_ANALYST'].includes(role)
    );

    const hasFullAccess = userRoles.some(role =>
        ['ORGANIZER', 'ROLE_ORGANIZER', 'ADMIN', 'ROLE_ADMIN'].includes(role)
    );

    console.log("Has Analytical Access?", hasAnalyticalAccess);
    console.log("Has Full Access?", hasFullAccess);
    console.log(userRoles);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ type: 'EXPENSE', amount: '', currency: 'INR', category: 'FOOD', source: 'UPI', note: '', createdAt: '' });

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterData, setFilterData] = useState({ startDate: '', endDate: '', minAmount: '', maxAmount: '' });
    const [isFilteredMode, setIsFilteredMode] = useState(false);
    const [detailsModalTx, setDetailsModalTx] = useState(null);
    const [activeChart, setActiveChart] = useState('flow');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let txData;
            if (isFilteredMode) {
                const p = {};
                if (filterData.startDate) p.startDate = filterData.startDate;
                if (filterData.endDate) p.endDate = filterData.endDate;
                if (filterData.minAmount) p.minAmount = parseFloat(filterData.minAmount);
                if (filterData.maxAmount) p.maxAmount = parseFloat(filterData.maxAmount);
                txData = await filterTransactions(p, page, pageSize);
            } else {
                txData = await fetchTransactions({ keyword: search, page, size: pageSize });
            }
            const summaryData = await fetchNetPosition();
            setTransactions(txData.content || txData || []);
            setTotalPages(txData.totalPages || 1);
            setSummary(summaryData || { income: 0, expense: 0, net: 0 });
        } catch (err) {
            console.error('Load failed', err);
        } finally {
            setLoading(false);
        }
    }, [isFilteredMode, filterData, search, page, pageSize]);

    useEffect(() => {
        const t = setTimeout(loadData, 300);
        return () => clearTimeout(t);
    }, [loadData, refreshTrigger]);

    const refresh = () => setRefreshTrigger(p => p + 1);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!hasFullAccess) return; // Extra security safeguard
        try {
            const payload = { ...formData, amount: parseFloat(formData.amount) };
            if (editingId) await updateTransaction(editingId, payload);
            else await createTransaction(payload);
            setIsFormModalOpen(false);
            refresh();
        } catch { alert('Error saving transaction.'); }
    };

    const handleDelete = async (id) => {
        if (!hasFullAccess) return; // Extra security safeguard
        if (!window.confirm('Delete this transaction?')) return;
        try { await deleteTransaction(id); refresh(); } catch (err) { console.error(err); }
    };

    const handleViewDetails = async (id) => {
        try { setDetailsModalTx(await fetchTransactionById(id)); } catch (err) { console.error(err); }
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        setIsFilteredMode(true);
        setPage(0);
        setIsFilterModalOpen(false);
        refresh();
    };

    const handleClearFilters = () => {
        setFilterData({ startDate: '', endDate: '', minAmount: '', maxAmount: '' });
        setIsFilteredMode(false);
        setPage(0);
        refresh();
    };

    const openNew = () => {
        if (!hasFullAccess) return;
        setFormData({ type: 'EXPENSE', amount: '', currency: 'INR', category: 'FOOD', source: 'UPI', note: '', createdAt: new Date().toISOString().split('T')[0] });
        setEditingId(null);
        setIsFormModalOpen(true);
    };

    const openEdit = (tx) => {
        if (!hasFullAccess) return;
        setFormData({ type: tx.type || 'EXPENSE', amount: tx.amount || '', currency: tx.currency || 'INR', category: tx.category || 'OTHER', source: tx.source || 'OTHER', note: tx.note || '', createdAt: tx.createdAt ? tx.createdAt.split('T')[0] : '' });
        setEditingId(tx.id);
        setIsFormModalOpen(true);
    };

    // ── Chart data Processing
    const expenseByCategory = transactions.filter(t => t.type === 'EXPENSE').reduce((a, t) => { a[t.category] = (a[t.category] || 0) + t.amount; return a; }, {});
    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const totalExpense = pieData.reduce((s, d) => s + d.value, 0);

    const groupedFlowData = transactions.reduce((acc, tx) => {
        const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Unknown';
        if (!acc[dateStr]) acc[dateStr] = { name: dateStr, Income: 0, Expense: 0, timestamp: new Date(tx.createdAt).getTime() };
        if (tx.type === 'INCOME') acc[dateStr].Income += tx.amount;
        if (tx.type === 'EXPENSE') acc[dateStr].Expense += tx.amount;
        return acc;
    }, {});

    const flowData = Object.values(groupedFlowData)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ name, Income, Expense }) => ({ name, Income, Expense }))
        .slice(-10);

    // ── Loading state
    if (loading && transactions.length === 0) return (
        <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 24 }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,255,255,0.05)', borderRadius: 14 }} />
                <div style={{ position: 'absolute', inset: 0, border: '2px solid', borderColor: `${PALETTE.emerald} transparent transparent transparent`, borderRadius: 14, animation: 'spin 1.4s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} color={PALETTE.emerald} /></div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Initialising treasury...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: '"DM Sans", system-ui, sans-serif', padding: '32px 24px 64px', maxWidth: 1400, margin: '0 auto' }}>
            <style>{css}</style>

            {/* ── HEADER ── */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 48 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE.emerald, boxShadow: `0 0 10px ${PALETTE.emerald}` }} />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Treasury
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

                    {/* Search (Available to ALL) */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 14px', gap: 8 }}>
                        <Search size={14} color="rgba(255,255,255,0.3)" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            disabled={isFilteredMode}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: 140, padding: '10px 0', fontFamily: 'inherit', opacity: isFilteredMode ? 0.4 : 1 }}
                        />
                    </div>

                    {/* Filter Button (Available to ALL) */}
                    <button onClick={() => setIsFilterModalOpen(true)} className="btn-secondary" style={{ color: isFilteredMode ? PALETTE.indigo : 'rgba(255,255,255,0.6)', borderColor: isFilteredMode ? `${PALETTE.indigo}40` : 'rgba(255,255,255,0.08)', background: isFilteredMode ? `${PALETTE.indigo}10` : 'rgba(255,255,255,0.03)' }}>
                        <Filter size={14} /> {isFilteredMode ? 'Filters On' : 'Filter'}
                    </button>

                    {/* RBAC: Export Button (Analyst, Admin, Organizer) */}
                    {hasAnalyticalAccess && (
                        <button onClick={exportTransactionsPdf} className="btn-secondary">
                            <Download size={14} /> Export
                        </button>
                    )}

                    {/* RBAC: New Entry Button (Admin, Organizer ONLY) */}
                    {hasFullAccess && (
                        <button onClick={openNew} className="btn-primary">
                            <Plus size={14} /> New Entry
                        </button>
                    )}
                </div>
            </header>

            {/* ── STATS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
                <StatCard icon={ArrowUp} title="Total Income" value={fmt(summary.income)} color={PALETTE.emerald} />
                <StatCard icon={ArrowDown} title="Total Expenses" value={fmt(summary.expense)} color={PALETTE.rose} />
                <StatCard icon={Landmark} title="Net Position" value={fmt(summary.net)} color={summary.net >= 0 ? PALETTE.emerald : PALETTE.rose} />
            </div>

            {/* ── MAIN GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: hasAnalyticalAccess ? 'minmax(0, 1.6fr) minmax(0, 1fr)' : '1fr', gap: 28, alignItems: 'start' }}>

                {/* LEFT: Ledger */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                            <Receipt size={15} color="rgba(255,255,255,0.3)" /> Ledger
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{page + 1} / {totalPages}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading} className="btn-icon"><ChevronLeft size={14} /></button>
                                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || loading} className="btn-icon"><ChevronRight size={14} /></button>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden' }}>
                        {transactions.length === 0 && !loading ? (
                            <div style={{ padding: 64, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                <Receipt size={32} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                                <p style={{ margin: 0, fontSize: 14 }}>No transactions found.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Date', 'Details', 'Type', 'Amount', ''].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Amount' ? 'right' : h === '' ? 'center' : 'left', color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {transactions.map((tx, idx) => (
                                    <tr key={tx.id} className="ledger-row" style={{ borderBottom: idx < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{tx.createdAt ? new Date(tx.createdAt).getFullYear() : ''}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {tx.category} <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}>●</span> <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{tx.source}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || 'No note'}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: tx.type === 'INCOME' ? `${PALETTE.emerald}15` : `${PALETTE.rose}15`, color: tx.type === 'INCOME' ? PALETTE.emerald : PALETTE.rose, border: `1px solid ${tx.type === 'INCOME' ? PALETTE.emerald : PALETTE.rose}25` }}>{tx.type}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 700, color: tx.type === 'INCOME' ? PALETTE.emerald : 'rgba(255,255,255,0.9)' }}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div className="row-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0 }}>

                                                {/* View Button - Available to ALL */}
                                                <button onClick={() => handleViewDetails(tx.id)} className="action-btn"><Eye size={13} /></button>

                                                {/* Edit Button - Admin/Organizer ONLY */}
                                                {hasFullAccess && (
                                                    <button onClick={() => openEdit(tx)} className="action-btn" style={{ '--hover-color': PALETTE.gold }}><Edit2 size={13} /></button>
                                                )}

                                                {/* Delete Button - Admin/Organizer ONLY */}
                                                {hasFullAccess && (
                                                    <button onClick={() => handleDelete(tx.id)} className="action-btn" style={{ '--hover-color': PALETTE.rose }}><Trash2 size={13} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* RIGHT: Charts (RBAC: Analyst, Admin, Organizer ONLY) */}
                {hasAnalyticalAccess && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 4px 0' }}>
                                {[{ id: 'flow', label: 'Cash Flow', icon: TrendingUp }, { id: 'breakdown', label: 'Breakdown', icon: PieChartIcon }, { id: 'categories', label: 'Top Spend', icon: BarChart3 }].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveChart(tab.id)}
                                        style={{ flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', borderRadius: '10px 10px 0 0', transition: 'all 0.2s', background: activeChart === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent', color: activeChart === tab.id ? '#fff' : 'rgba(255,255,255,0.3)', borderBottom: activeChart === tab.id ? `2px solid ${PALETTE.emerald}` : '2px solid transparent', marginBottom: activeChart === tab.id ? -1 : 0 }}
                                    >
                                        <tab.icon size={13} /> <span style={{ display: 'none' }}>{tab.label}</span> <span style={{ display: 'block' }}>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: '24px 20px 20px' }}>
                                {activeChart === 'flow' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <div>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Recent Flow</p>
                                                <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', margin: 0 }}>{fmt(summary.income - summary.expense)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><span style={{ width: 20, height: 2, background: PALETTE.emerald, borderRadius: 99, display: 'inline-block' }} /> Income</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><span style={{ width: 20, height: 2, background: PALETTE.rose, borderRadius: 99, display: 'inline-block' }} /> Expense</div>
                                            </div>
                                        </div>
                                        {flowData.length > 0 ? <CashFlowChart data={flowData} /> : <EmptyChart />}
                                    </div>
                                )}
                                {activeChart === 'breakdown' && (
                                    <div>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Expense Breakdown</p>
                                        {pieData.length > 0 ? <DonutChart data={pieData} /> : <EmptyChart />}
                                    </div>
                                )}
                                {activeChart === 'categories' && (
                                    <div>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>Top Categories</p>
                                        {pieData.length > 0 ? pieData.slice(0, 6).map((d, i) => (<CategoryBar key={d.name} name={d.name} value={d.value} total={totalExpense} color={CHART_COLORS[i % CHART_COLORS.length]} index={i} />)) : <EmptyChart />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════
                MODALS
            ══════════════════════════════════════════════ */}

            {/* Form Modal (Protected by hasFullAccess check in openNew/openEdit, but wrapping in condition for safety) */}
            {hasFullAccess && (
                <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingId ? 'Edit Transaction' : 'New Transaction'} icon={Receipt} maxW={520}>
                    <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div><label style={labelStyle}>Amount</label><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontFamily: 'monospace' }}>₹</span><input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 36, fontSize: 20, fontFamily: '"DM Mono", monospace', fontWeight: 700 }} onFocus={e => e.target.style.borderColor = PALETTE.indigo} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} /></div></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label style={labelStyle}>Type</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, category: CATEGORIES[e.target.value][0] })} required style={inputStyle} onFocus={e => e.target.style.borderColor = PALETTE.indigo} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}>{TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div><label style={labelStyle}>Date</label><input type="date" required value={formData.createdAt} onChange={e => setFormData({ ...formData, createdAt: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = PALETTE.indigo} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} /></div></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label style={labelStyle}>Category</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required style={inputStyle} onFocus={e => e.target.style.borderColor = PALETTE.indigo} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}>{CATEGORIES[formData.type].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div><div><label style={labelStyle}>Source</label><select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} required style={inputStyle} onFocus={e => e.target.style.borderColor = PALETTE.indigo} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}>{SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></div></div>
                        <div><label style={labelStyle}>Note (optional)</label><input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="What was this for?" style={inputStyle} onFocus={e => e.target.style.borderColor = PALETTE.indigo} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} /></div>
                        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}><button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '13px' }}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px' }}>{editingId ? 'Update' : 'Save'}</button></div>
                    </form>
                </Modal>
            )}

            {/* Filter Modal */}
            <Modal open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filter Transactions" icon={Filter} maxW={440}>
                <form onSubmit={handleApplyFilters} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label style={labelStyle}>Start Date</label><input type="date" value={filterData.startDate} onChange={e => setFilterData({ ...filterData, startDate: e.target.value })} style={inputStyle} /></div><div><label style={labelStyle}>End Date</label><input type="date" value={filterData.endDate} onChange={e => setFilterData({ ...filterData, endDate: e.target.value })} style={inputStyle} /></div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label style={labelStyle}>Min Amount</label><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>₹</span><input type="number" value={filterData.minAmount} onChange={e => setFilterData({ ...filterData, minAmount: e.target.value })} placeholder="0" style={{ ...inputStyle, paddingLeft: 28 }} /></div></div><div><label style={labelStyle}>Max Amount</label><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>₹</span><input type="number" value={filterData.maxAmount} onChange={e => setFilterData({ ...filterData, maxAmount: e.target.value })} placeholder="∞" style={{ ...inputStyle, paddingLeft: 28 }} /></div></div></div>
                    <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}><button type="button" onClick={handleClearFilters} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${PALETTE.rose}30`, background: `${PALETTE.rose}10`, color: PALETTE.rose, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Clear</button><button type="submit" style={{ flex: 1, padding: 13, borderRadius: 12, border: 'none', background: PALETTE.indigo, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Apply</button></div>
                </form>
            </Modal>

            {/* Details Modal */}
            <Modal open={!!detailsModalTx} onClose={() => setDetailsModalTx(null)} title="Receipt" icon={Receipt} maxW={420}>
                {detailsModalTx && (
                    <>
                        <div style={{ padding: '32px 24px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                            <p style={{ color: detailsModalTx.type === 'INCOME' ? PALETTE.emerald : PALETTE.rose, fontSize: 36, fontWeight: 900, fontFamily: '"DM Mono", monospace', margin: '0 0 12px' }}>{detailsModalTx.type === 'INCOME' ? '+' : '-'}{fmt(detailsModalTx.amount)}</p>
                            <span style={{ padding: '4px 14px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: detailsModalTx.type === 'INCOME' ? `${PALETTE.emerald}15` : `${PALETTE.rose}15`, color: detailsModalTx.type === 'INCOME' ? PALETTE.emerald : PALETTE.rose, border: `1px solid ${detailsModalTx.type === 'INCOME' ? PALETTE.emerald : PALETTE.rose}25` }}>{detailsModalTx.type}</span>
                        </div>
                        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {[{ label: 'Category', value: detailsModalTx.category }, { label: 'Source', value: detailsModalTx.source }, { label: 'Date', value: detailsModalTx.createdAt ? new Date(detailsModalTx.createdAt).toLocaleString('en-GB') : 'N/A' }].map(f => (
                                <div key={f.label}><span style={{ display: 'block', color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{f.label}</span><span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{f.value}</span></div>
                            ))}
                            <div style={{ gridColumn: '1 / -1' }}><span style={{ display: 'block', color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Note</span><span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>{detailsModalTx.note || 'No notes attached.'}</span></div>
                            <div style={{ gridColumn: '1 / -1' }}><span style={{ display: 'block', color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Transaction ID</span><span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>{detailsModalTx.id}</span></div>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}

const EmptyChart = () => <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No data to display</div>;

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 12px; border: none; background: #fff; color: #000; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.btn-primary:hover { background: #e2e8f0; transform: translateY(-1px); }
.btn-secondary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.btn-secondary:hover { background: rgba(255,255,255,0.07); color: #fff; }
.btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s; }
.btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; }
.btn-icon:disabled { opacity: 0.25; cursor: not-allowed; }
.ledger-row { transition: background 0.15s; }
.ledger-row:hover { background: rgba(255,255,255,0.025); }
.ledger-row:hover .row-actions { opacity: 1 !important; }
.row-actions { transition: opacity 0.15s; }
.action-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s; }
.action-btn:hover { background: rgba(255,255,255,0.1); color: var(--hover-color, #fff); }
input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
select option { background: #111117; color: #fff; }
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr !important; } }
`;