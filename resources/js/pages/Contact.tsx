import { Head } from '@inertiajs/react';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Contact() {
    return (
        <>
            <Head title="Contact" />
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Contact Us</h1>
                    <p className="mt-4 text-lg text-neutral-500">
                        Get in touch with Danob Trading PLC for orders and inquiries.
                    </p>
                </div>

                <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                            <Phone className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-neutral-900">Phone</h3>
                        <p className="mt-2 text-sm text-neutral-500">Call us for orders and inquiries</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                            <Mail className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-neutral-900">Email</h3>
                        <p className="mt-2 text-sm text-neutral-500">Send us a message anytime</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                            <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-neutral-900">Visit Us</h3>
                        <p className="mt-2 text-sm text-neutral-500">Find a branch near you</p>
                    </div>
                </div>
            </div>
        </>
    );
}
