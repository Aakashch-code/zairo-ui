import React, { useState, useEffect } from 'react';
import { fetchWorkspaceUsers, updateUser, deleteUser } from '../../service/api';
import { Users, Shield, ShieldAlert, Trash2, Edit2, X, Check, Search, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function WorkspaceTeam() {
    const navigate = useNavigate();

    // ✅ 1. RBAC Check (Strict)
    const savedRolesRaw = localStorage.getItem('roles');
    const userRoles = savedRolesRaw ? JSON.parse(savedRolesRaw) : ['ROLE_VIEWER'];
    const hasAdminAccess = userRoles.some(role =>
        ['ORGANIZER', 'ROLE_ORGANIZER', 'ADMIN', 'ROLE_ADMIN'].includes(role)
    );

    // ✅ State Management
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    // Modal State
    const [editingUser, setEditingUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Load Data
    useEffect(() => {
        if (!hasAdminAccess) return; // Don't fetch if unauthorized
        loadUsers();
    }, [hasAdminAccess]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchWorkspaceUsers();
            // Fallback to array if backend wraps it in an object
            setUsers(Array.isArray(data) ? data : data.content || []);
        } catch (err) {
            console.error("Failed to load users:", err);
            setError("Failed to load workspace users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Actions
    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to remove ${userName} from the workspace?`)) return;

        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user. They might have active transactions.");
        }
    };

    const handleEditClick = (user) => {
        // Extract the primary role to show in the dropdown
        let currentRole = 'VIEWER';
        if (user.roles && user.roles.length > 0) {
            currentRole = typeof user.roles[0] === 'string' ? user.roles[0].replace('ROLE_', '') : user.roles[0].name.replace('ROLE_', '');
        }

        setEditingUser({
            ...user,
            selectedRole: currentRole
        });
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Send the updated payload. Adjust the structure based on what your backend expects.
            await updateUser(editingUser.id, {
                roles: [editingUser.selectedRole] // Example: updating role
            });

            setEditingUser(null);
            loadUsers(); // Refresh list to get updated data
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update user details.");
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ Access Denied View
    if (!hasAdminAccess) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
                <p className="text-zinc-500 mb-6 text-center max-w-md">
                    You do not have the required permissions to view or manage the workspace team. Only Admins and Organizers are permitted.
                </p>
                <button onClick={() => navigate('/')} className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Filtered users for search bar
    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black p-8 text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-emerald-400 font-bold tracking-widest text-xs uppercase">Workspace Settings</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">Team Management</h1>
                        <p className="text-zinc-500 mt-2">Manage access and roles for your organization.</p>
                    </div>

                    <div className="relative group w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                        />
                    </div>
                </header>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 flex items-center gap-3 text-red-400">
                        <ShieldAlert className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Main Table */}
                <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-zinc-500">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                            <p className="uppercase tracking-widest text-xs font-bold">Loading Team...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-20 text-center text-zinc-500">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No users found matching your search.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="border-b border-white/10 bg-zinc-900/50">
                                    <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">User</th>
                                    <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Role</th>
                                    <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredUsers.map((user) => {
                                    // ✅ 1. Bulletproof Role Extraction
                                    let rawRole = 'VIEWER';

                                    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
                                        // Handles { roles: ["ORGANIZER"] } or { roles: [{ name: "ROLE_ORGANIZER" }] }
                                        rawRole = user.roles[0].name || user.roles[0].authority || user.roles[0];
                                    } else if (user.role) {
                                        // Handles { role: "ORGANIZER" }
                                        rawRole = user.role;
                                    } else if (user.authorities && Array.isArray(user.authorities) && user.authorities.length > 0) {
                                        // Handles standard Spring Security { authorities: [{ authority: "ROLE_ORGANIZER" }] }
                                        rawRole = user.authorities[0].authority || user.authorities[0];
                                    }

                                    const displayRole = String(rawRole).replace('ROLE_', '').toUpperCase();

                                    // ✅ 2. Extract Display Name and Email correctly
                                    const displayName = user.username || user.name || 'Unknown User';
                                    const displayEmail = user.email || 'No email provided';
                                    const initial = displayName.charAt(0).toUpperCase();

                                    return (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-emerald-400">
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        {/* Shows Username on top, Email on bottom */}
                                                        <div className="font-bold text-white">{displayName}</div>
                                                        <div className="text-sm text-zinc-500">{displayEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border tracking-wider
                                                        ${displayRole === 'ORGANIZER' || displayRole === 'ADMIN'
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        : displayRole === 'ANALYST'
                                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                                        {displayRole}
                                                    </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                                        title="Edit Role"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, displayName)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                                        title="Remove User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
                    <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                Edit User Access
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUpdate} className="p-6">
                            <div className="mb-6">
                                <p className="text-sm text-zinc-400 mb-1">User</p>
                                <p className="font-bold text-white text-lg">{editingUser.name || editingUser.username}</p>
                            </div>

                            <div className="space-y-2 mb-8">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                    Workspace Role
                                </label>
                                <select
                                    value={editingUser.selectedRole}
                                    onChange={(e) => setEditingUser({...editingUser, selectedRole: e.target.value})}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                                >
                                    <option value="VIEWER">Viewer (Read Only)</option>
                                    <option value="ANALYST">Analyst (Export & View Charts)</option>
                                    <option value="ORGANIZER">Organizer (Full Access)</option>
                                    <option value="ADMIN">Admin (Superuser)</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}