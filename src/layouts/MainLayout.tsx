import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function MainLayout() {
    const { user } = useAuth();
    const location = useLocation();

    // Rotas como Instituição possuem seus próprios layouts Full-Screen (Sidebar + Header próprio).
    const isFullScreenLayout = location.pathname.startsWith('/portal/institutional');

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden">
            {!isFullScreenLayout && <Navbar />}
            <main className="flex-1 overflow-x-hidden">
                <Outlet />
            </main>
            {!isFullScreenLayout && <Footer />}
            {user && !isFullScreenLayout && <ChatWidget />}
        </div>
    );
}
