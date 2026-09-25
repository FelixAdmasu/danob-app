import { useState } from 'react';
import { MapPin } from 'lucide-react';

type BranchVisualProps = {
    /** Branch name — used as the photo's alt text. */
    name: string;
    /** Uploaded branch photo; when absent (or broken) the location tile shows. */
    imageUrl: string | null;
};

/**
 * Location tile for branch cards: a designed map-pin stage by default,
 * covered by the branch's own photo once one has been uploaded. If the
 * photo fails to load we fall back to the tile — never to another image.
 */
export default function BranchVisual({ name, imageUrl }: BranchVisualProps) {
    const [failed, setFailed] = useState(false);
    const showPhoto = Boolean(imageUrl) && !failed;

    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5] transition-transform duration-700 group-hover:scale-105">
            {/* Faint street grid, faded toward the edges */}
            <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, #070E01 1px, transparent 1px), linear-gradient(to bottom, #070E01 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                    opacity: 0.05,
                    maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                }}
            />
            {!showPhoto && (
                <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-36 w-36 items-center justify-center">
                        <span className="absolute inset-0 rounded-full border border-[#070E01]/15" />
                        <span className="absolute inset-0 animate-ping rounded-full border border-[#2D5016]/40 [animation-duration:4s]" />
                        <MapPin className="relative h-12 w-12 text-[#2D5016]/70" strokeWidth={1.5} />
                    </div>
                </div>
            )}
            {showPhoto && (
                <img
                    src={imageUrl ?? undefined}
                    alt={name}
                    onError={() => setFailed(true)}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}
        </div>
    );
}
