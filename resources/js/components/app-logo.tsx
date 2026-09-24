import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <img
                src="/android-chrome-192x192.png"
                alt=""
                className="size-8 shrink-0 rounded-full ring-1 ring-border"
            />
            <div className="ml-1 grid flex-1 overflow-hidden text-left leading-none">
                <span className="truncate font-serif text-[15px] font-semibold tracking-tight">
                    {name}
                </span>
                <span className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    Control Panel
                </span>
            </div>
        </>
    );
}
