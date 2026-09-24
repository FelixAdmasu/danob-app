<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png">
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">
        <meta name="theme-color" content="#070E01">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>Danob Trading PLC</title>

        @fonts
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />

        {{--
            Admin boot skeleton: shown while the JS bundle loads on admin,
            settings and account pages only (gated server-side via $page).
            Hides itself the moment React mounts children into #app.
        --}}
        @php($bootComponent = $page['component'] ?? '')
        @if(str_starts_with($bootComponent, 'Admin/') || str_starts_with($bootComponent, 'settings/') || $bootComponent === 'dashboard')
        <style>
            .app-boot-skeleton {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                overflow: hidden;
                background: var(--background);
            }
            #app:has(*) ~ .app-boot-skeleton { display: none !important; }
            .app-boot-skeleton .sk {
                background: var(--muted);
                border-radius: 8px;
                animation: boot-skeleton-pulse 1.4s ease-in-out infinite;
            }
            .app-boot-skeleton .sk-sidebar {
                display: none;
                width: 16rem;
                flex-shrink: 0;
                flex-direction: column;
                gap: 1.25rem;
                padding: 1.25rem 1rem;
                background: var(--card);
                border-right: 1px solid rgba(7, 14, 1, 0.05);
            }
            .app-boot-skeleton .sk-main {
                display: flex;
                flex: 1;
                flex-direction: column;
                min-width: 0;
            }
            .app-boot-skeleton .sk-topbar {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                height: 3.5rem;
                flex-shrink: 0;
                padding: 0 1.5rem;
                background: var(--card);
                border-bottom: 1px solid rgba(7, 14, 1, 0.06);
            }
            .app-boot-skeleton .sk-content {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                width: 100%;
                max-width: 1600px;
                margin: 0 auto;
                padding: 1.5rem;
            }
            .app-boot-skeleton .sk-heading {
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
            }
            .app-boot-skeleton .sk-eyebrow { height: 0.625rem; width: 6rem; }
            .app-boot-skeleton .sk-title { height: 2rem; width: clamp(12rem, 30vw, 20rem); }
            .app-boot-skeleton .sk-desc { height: 0.75rem; width: clamp(16rem, 40vw, 28rem); }
            .app-boot-skeleton .sk-toolbar { height: 3.5rem; width: 100%; }
            .app-boot-skeleton .sk-card {
                display: flex;
                flex-direction: column;
                gap: 1.25rem;
                padding: 1.5rem;
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: 12px;
                box-shadow: 0 1px 2px rgb(7 14 1 / 0.04);
            }
            .app-boot-skeleton .sk-cardhead { height: 1.1rem; width: 9rem; }
            .app-boot-skeleton .sk-row { display: flex; align-items: center; gap: 1.5rem; }
            .app-boot-skeleton .sk-cell { height: 0.875rem; flex: 1; }
            .app-boot-skeleton .sk-cell-a { flex: none; width: 2.75rem; }
            .app-boot-skeleton .sk-cell-b { flex: 2.2; }
            .app-boot-skeleton .sk-cell-c { flex: 1.4; }
            .app-boot-skeleton .sk-group { display: flex; flex-direction: column; gap: 0.6rem; }
            .app-boot-skeleton .sk-label { height: 0.55rem; width: 45%; opacity: 0.75; }
            .app-boot-skeleton .sk-item { height: 2.25rem; width: 100%; }
            .app-boot-skeleton .sk-logo { height: 2.25rem; width: 75%; }
            .app-boot-skeleton .sk-dot { height: 1.5rem; width: 1.5rem; border-radius: 6px; flex: none; }
            .app-boot-skeleton .sk-crumb { height: 0.7rem; width: 9rem; flex: none; }
            .app-boot-skeleton .sk-row:nth-child(even) .sk { animation-delay: 0.15s; }
            .app-boot-skeleton .sk-row:nth-child(odd) .sk { animation-delay: 0.3s; }
            @keyframes boot-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
            @media (min-width: 768px) {
                .app-boot-skeleton .sk-sidebar { display: flex; }
            }
            @media (max-width: 767px) {
                .app-boot-skeleton .sk-content { padding: 1rem; }
                .app-boot-skeleton .sk-topbar { padding: 0 1rem; }
            }
            @media (prefers-reduced-motion: reduce) {
                .app-boot-skeleton .sk { animation: none; }
            }
        </style>
        <div class="app-boot-skeleton" aria-hidden="true">
            <div class="sk-sidebar">
                <div class="sk sk-logo"></div>
                <div class="sk-group"><div class="sk sk-label"></div><div class="sk sk-item"></div><div class="sk sk-item"></div><div class="sk sk-item"></div></div>
                <div class="sk-group"><div class="sk sk-label"></div><div class="sk sk-item"></div><div class="sk sk-item"></div></div>
                <div class="sk-group"><div class="sk sk-label"></div><div class="sk sk-item"></div><div class="sk sk-item"></div></div>
            </div>
            <div class="sk-main">
                <div class="sk-topbar"><div class="sk sk-dot"></div><div class="sk sk-crumb"></div></div>
                <div class="sk-content">
                    <div class="sk-heading">
                        <div class="sk sk-eyebrow"></div>
                        <div class="sk sk-title"></div>
                        <div class="sk sk-desc"></div>
                    </div>
                    <div class="sk sk-toolbar"></div>
                    <div class="sk-card">
                        <div class="sk sk-cardhead"></div>
                        <div class="sk-row"><div class="sk sk-cell sk-cell-a"></div><div class="sk sk-cell sk-cell-b"></div><div class="sk sk-cell sk-cell-c"></div><div class="sk sk-cell"></div></div>
                        <div class="sk-row"><div class="sk sk-cell sk-cell-a"></div><div class="sk sk-cell sk-cell-b"></div><div class="sk sk-cell sk-cell-c"></div><div class="sk sk-cell"></div></div>
                        <div class="sk-row"><div class="sk sk-cell sk-cell-a"></div><div class="sk sk-cell sk-cell-b"></div><div class="sk sk-cell sk-cell-c"></div><div class="sk sk-cell"></div></div>
                        <div class="sk-row"><div class="sk sk-cell sk-cell-a"></div><div class="sk sk-cell sk-cell-b"></div><div class="sk sk-cell sk-cell-c"></div><div class="sk sk-cell"></div></div>
                    </div>
                </div>
            </div>
        </div>
        @endif
    </body>
</html>
