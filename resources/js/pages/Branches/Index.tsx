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
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Our Branches</h1>
                    <p className="mt-3 text-base text-neutral-500">Find a Danob branch near you.</p>
                </div>

                {branches.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {branches.map((branch) => (
                            <div key={branch.id} className="rounded-xl border border-neutral-200 bg-white p-6">
                                <h3 className="text-lg font-semibold text-neutral-900">{branch.name}</h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-start gap-3 text-sm text-neutral-600">
                                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                                        <span>
                                            {branch.address}
                                            {branch.city ? `, ${branch.city}` : ''}
                                            {branch.sub_city ? `, ${branch.sub_city}` : ''}
                                            {branch.kebele ? `, Kebele ${branch.kebele}` : ''}
                                        </span>
                                    </div>
                                    {branch.phone && (
                                        <div className="flex items-center gap-3 text-sm text-neutral-600">
                                            <Phone className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.opening_hours && (
                                        <div className="flex items-center gap-3 text-sm text-neutral-600">
                                            <Clock className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                                            <span>{branch.opening_hours}</span>
                                        </div>
                                    )}
                                </div>
                                {branch.services && (
                                    <div className="mt-4 border-t border-neutral-100 pt-4">
                                        <p className="text-xs font-medium text-neutral-500">Services</p>
                                        <p className="mt-1 text-sm text-neutral-600">{branch.services}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
                        <MapPin className="mx-auto h-12 w-12 text-neutral-300" />
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No branches found</h3>
                        <p className="mt-2 text-sm text-neutral-500">Branch locations will appear here once added.</p>
                    </div>
                )}
            </div>
        </>
    );
}
