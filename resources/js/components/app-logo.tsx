import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ring-white/15">
                <img
                    src="/android-chrome-192x192.png"
                    alt=""
                    className="size-full object-cover"
                />
            </span>
            <div className="ml-1 grid flex-1 overflow-hidden text-left leading-none">
                <span className="truncate font-serif text-[15px] font-semibold tracking-tight text-white">
                    {name}
                </span>
                <span className="mt-1 truncate text-[9px] font-semibold tracking-[0.24em] text-white/40 uppercase">
                    Control Panel
                </span>
            </div>
        </>
    );
}
