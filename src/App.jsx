import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// --- Component Imports ---
import Sidebar from './components/Sidebar';
import Dashboard from "./pages/Dashboard.jsx";
import Register from "./pages/authentication/Register.jsx";
import Login from "./pages/authentication/Login.jsx";
import WorkspaceTeam from "./pages/workspace/WorkspaceTeam.jsx";
import ZaiAI from "./pages/ai/Zai.jsx";


// --- Layout Wrapper ---
// This component handles showing/hiding the sidebar based on the current URL
const MainLayout = ({ children }) => {
    const location = useLocation();

    // List of routes where the Sidebar should NOT appear
    const hideSidebarRoutes = ["/login", "/signup", "/register"];

    const isFullScreen = hideSidebarRoutes.includes(location.pathname);

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
            {!isFullScreen && <Sidebar />}

            {/* If isFullScreen is true, we remove the margin entirely (ml-0) */}
            <main className={`flex-1 min-h-screen transition-all duration-300 ${!isFullScreen ? 'lg:ml-64' : 'ml-0'}`}>
                {children}
            </main>
        </div>
    );
};
function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    {/* --- Public Routes --- */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* --- Protected Routes --- */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<WorkspaceTeam />} />
                    <Route path="/zai" element={<ZaiAI/>} />
                    {/* --- 404 Fallback --- */}
                    <Route path="*" element={
                        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
                            <h1 className="text-9xl font-bold text-zinc-900">404</h1>
                            <p className="text-xl text-zinc-400 mt-4 mb-8">
                                Page not found.
                            </p>
                            <a
                                href="/"
                                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Back to Dashboard
                            </a>
                        </div>
                    } />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;