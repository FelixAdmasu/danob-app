import { createInertiaApp, router } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import PublicLayout from '@/layouts/public-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Danob';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case name.toLowerCase().startsWith('admin/') || name === 'dashboard':
                return AppLayout;
            default:
                return PublicLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#2D5016',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Global loading affordance: flag every Inertia visit so tables can show a
// dimmed shimmer while the next slice of data loads (rule lives in
// resources/css/app.css). Keeps search/filter interactions feeling alive
// on every table page without per-page skeleton code.
router.on('start', () => document.documentElement.setAttribute('data-inertia-pending', ''));
router.on('finish', () => document.documentElement.removeAttribute('data-inertia-pending'));
