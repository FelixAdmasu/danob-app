import { Head } from '@inertiajs/react';
import { MapPin, Phone, Clock } from 'lucide-react';
import BranchVisual from '@/components/branch-visual';

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
    image_url: string | null;
};

type Props = {
    branches: Branch[];
};

export default function BranchesIndex({ branches }: Props) {
    return (
        <>
            <Head title="Branches" />

            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <div className="mb-12 max-w-[1000px]">
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — Locations
                        </span>
                        <h1 className="max-w-4xl font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                            Our Branches.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-[#4A4A4A]">
                            Find a Danob branch near you.
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48">
                <div className="mx-auto max-w-[1920px]">
                    {branches.length > 0 ? (
                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {branches.map((branch) => (
                                <div key={branch.id} className="group">
                                    <div className="relative mb-8 aspect-[4/5] overflow-hidden">
                                        <BranchVisual
                                            name={branch.name}
                                            imageUrl={branch.image_url}
                                        />
                                    </div>
                                    <div className="border-b border-[#070E01]/10 pb-6">
                                        <h3 className="mb-4 font-serif text-2xl">
                                            {branch.name}
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-3 text-[11px] text-[#4A4A4A]">
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                <span>
                                                    {branch.address}
                                                    {branch.city
                                                        ? `, ${branch.city}`
                                                        : ''}
                                                    {branch.sub_city
                                                        ? `, ${branch.sub_city}`
                                                        : ''}
                                                    {branch.kebele
                                                        ? `, Kebele ${branch.kebele}`
                                                        : ''}
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
                                                    <span>
                                                        {branch.opening_hours}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {branch.services && (
                                            <div className="mt-4 border-t border-[#070E01]/10 pt-4">
                                                <p className="mb-1 text-[10px] font-bold tracking-widest text-[#4A4A4A] uppercase">
                                                    Services
                                                </p>
                                                <p className="text-[11px] text-[#4A4A4A]">
                                                    {branch.services}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <MapPin className="mx-auto mb-6 h-16 w-16 text-[#070E01]/15" />
                            <h3 className="font-serif text-2xl text-[#070E01]">
                                No branches found
                            </h3>
                            <p className="mt-2 text-sm text-[#4A4A4A]">
                                Branch locations will appear here once added.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
