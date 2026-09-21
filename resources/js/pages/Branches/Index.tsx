import { Head } from '@inertiajs/react';
import { MapPin, Phone, Clock } from 'lucide-react';

type Branch = {
    id: number;
    name: string;
    address: string;
    city: string;
    sub_city: string | null;
    kebele: string | null;
    phone: string | null;
    opening_hours: string | null;
    services: string | null;
};

type Props = {
    branches: Branch[];
};

export default function BranchesIndex({ branches }: Props) {
    return (
        <>
            <Head title="Branches" />

            <section className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <div className="max-w-[1000px] mb-12">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                            — Locations
                        </span>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] tracking-tighter text-[#070E01] max-w-4xl">
                            Our Branches.
                        </h1>
                        <p className="text-lg text-[#4A4A4A] mt-6 max-w-xl">
                            Find a Danob branch near you.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                <div className="max-w-[1920px] mx-auto">
                    {branches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                            {branches.map((branch) => (
                                <div key={branch.id} className="group">
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-[#D4E8C8]">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <MapPin className="h-16 w-16 text-[#070E01]/15" />
                                        </div>
                                    </div>
                                    <div className="border-b border-[#070E01]/10 pb-6">
                                        <h3 className="font-serif text-2xl mb-4">{branch.name}</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-3 text-[11px] text-[#4A4A4A]">
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                <span>
                                                    {branch.address}
                                                    {branch.city ? `, ${branch.city}` : ''}
                                                    {branch.sub_city ? `, ${branch.sub_city}` : ''}
                                                    {branch.kebele ? `, Kebele ${branch.kebele}` : ''}
                                                </span>
                                            </div>
                                            {branch.phone && (
                                                <div className="flex items-center gap-3 text-[11px] text-[#4A4A4A]">
                                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                                    <span>{branch.phone}</span>
                                                </div>
                                            )}
                                            {branch.opening_hours && (
                                                <div className="flex items-center gap-3 text-[11px] text-[#4A4A4A]">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    <span>{branch.opening_hours}</span>
                                                </div>
                                            )}
                                        </div>
                                        {branch.services && (
                                            <div className="mt-4 pt-4 border-t border-[#070E01]/10">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] mb-1">Services</p>
                                                <p className="text-[11px] text-[#4A4A4A]">{branch.services}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <MapPin className="mx-auto h-16 w-16 text-[#070E01]/15 mb-6" />
                            <h3 className="font-serif text-2xl text-[#070E01]">No branches found</h3>
                            <p className="text-sm text-[#4A4A4A] mt-2">Branch locations will appear here once added.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
