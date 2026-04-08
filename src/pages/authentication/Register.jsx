import React, { useState } from 'react';
import { registerUser } from '../../service/api'; // Real API import
import {
    User, Lock, Mail, UserPlus, Loader2, AlertCircle,
    ArrowRight, ShieldCheck, Briefcase, Key, ChevronDown, Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ROLES = [
    { value: 'ORGANIZER', label: 'Organizer', desc: 'Create & manage workspaces' },
    { value: 'ADMIN', label: 'Admin', desc: 'Full workspace access' },
    { value: 'ANALYST', label: 'Analyst', desc: 'Data & reporting access' },
    { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access' },
];

function Input({ icon: Icon, label, name, type = 'text', value, onChange, required, placeholder }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                {label}
            </label>
            <div className="relative group">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:bg-zinc-900 transition-all"
                />
            </div>
        </div>
    );
}

function RoleDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = ROLES.find(r => r.value === value);

    return (
        <div className="space-y-2 relative z-20">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                Role
            </label>
            <div className="relative group">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className={`w-full flex items-center justify-between bg-zinc-900/50 border ${open ? 'border-purple-500/50 bg-zinc-900 text-purple-400' : 'border-white/10 text-zinc-500'} hover:border-white/20 rounded-xl py-3.5 pl-12 pr-4 transition-all`}
                >
                    <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${open ? 'text-purple-400' : 'text-zinc-500 group-hover:text-purple-400'}`} />

                    <span className="text-white text-sm text-left flex-1 font-medium block">
                        {selected.label}
                    </span>

                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180 text-purple-400' : 'text-zinc-500'}`} />
                </button>

                {open && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {ROLES.map(role => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => { onChange(role.value); setOpen(false); }}
                                className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-900 transition-colors flex items-center justify-between group ${value === role.value ? 'bg-zinc-900/50' : ''}`}
                            >
                                <div className="flex flex-col">
                                    <span className={`font-medium ${value === role.value ? 'text-purple-400' : 'text-zinc-200'}`}>
                                        {role.label}
                                    </span>
                                    <span className="text-xs text-zinc-500 mt-0.5">{role.desc}</span>
                                </div>
                                {value === role.value && <Check size={16} className="text-purple-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'ORGANIZER',
        workspaceName: '',
        inviteCode: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                ...(formData.role === 'ORGANIZER'
                    ? { workspaceName: formData.workspaceName }
                    : { inviteCode: formData.inviteCode })
            };

            await registerUser(payload);
            navigate('/login');
        } catch (err) {
            console.error("Registration Error:", err);
            // Real API error handling mapping
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 text-purple-400">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account</h1>
                    <p className="text-zinc-500">Join the platform today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <RoleDropdown value={formData.role} onChange={(r) => setFormData(p => ({ ...p, role: r }))} />

                    <Input icon={User} label="Username" name="username" value={formData.username} onChange={handleChange} required placeholder="Choose a username" />
                    <Input icon={Mail} label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />

                    {formData.role === 'ORGANIZER' ? (
                        <Input icon={Briefcase} label="Workspace Name" name="workspaceName" value={formData.workspaceName} onChange={handleChange} required placeholder="My Company" />
                    ) : (
                        <Input icon={Key} label="Invite Code" name="inviteCode" value={formData.inviteCode} onChange={handleChange} required placeholder="Paste your invite code" />
                    )}

                    <Input icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Create a strong password" />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Get Started</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-zinc-600 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}