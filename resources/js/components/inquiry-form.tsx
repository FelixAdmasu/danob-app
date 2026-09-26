import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';

const interests = [
    'Product Inquiry',
    'Branch Visit',
    'Wholesale Order',
    'Partnership',
] as const;

type InquiryFormProps = {
    compact?: boolean;
    productId?: number;
    productName?: string;
    variants?: { id: number; name: string; unit: string }[];
};

export default function InquiryForm({
    compact = false,
    productId,
    productName,
    variants = [],
}: InquiryFormProps) {
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        variants.length === 1 ? variants[0].id : null,
    );
    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm({
            name: '',
            email: '',
            phone: '',
            interest: 'Product Inquiry',
            message: '',
            website: '',
            product_id: productId ?? null,
            variant_id: variants.length === 1 ? variants[0].id : null,
            requested_quantity: productId ? 1 : null,
        });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/inquiries', {
            preserveScroll: true,
            onSuccess: () =>
                setData({
                    name: '',
                    email: '',
                    phone: '',
                    interest: 'Product Inquiry',
                    message: '',
                    website: '',
                    product_id: productId ?? null,
                    variant_id: selectedVariantId,
                    requested_quantity: productId ? 1 : null,
                }),
        });
    };

    return (
        <form
            onSubmit={submit}
            className={`rounded-[16px] border border-[#070E01]/10 bg-white p-8 md:p-12 ${compact ? '' : 'lg:w-1/2'}`}
        >
            <div className="space-y-8 md:space-y-12">
                {productId && (
                    <div className="border-b border-[#070E01]/20 pb-6">
                        <span className="mb-2 block text-[9px] font-bold tracking-[0.4em] text-[#2D5016] uppercase">
                            Request a quote
                        </span>
                        <p className="font-serif text-2xl text-[#070E01]">
                            {productName}
                        </p>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            {variants.length > 0 && (
                                <div className="space-y-2">
                                    <label
                                        htmlFor="inquiry-variant"
                                        className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                                    >
                                        Option
                                    </label>
                                    <select
                                        id="inquiry-variant"
                                        value={selectedVariantId ?? ''}
                                        onChange={(event) => {
                                            const value = event.target.value
                                                ? Number(event.target.value)
                                                : null;
                                            setSelectedVariantId(value);
                                            setData('variant_id', value);
                                        }}
                                        className="w-full cursor-pointer appearance-none border-b border-[#070E01]/20 bg-transparent py-2 font-serif text-lg outline-none"
                                    >
                                        <option value="">
                                            Any available option
                                        </option>
                                        {variants.map((variant) => (
                                            <option
                                                key={variant.id}
                                                value={variant.id}
                                            >
                                                {variant.name} · {variant.unit}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.variant_id} />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label
                                    htmlFor="inquiry-quantity"
                                    className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                                >
                                    Estimated quantity
                                </label>
                                <input
                                    id="inquiry-quantity"
                                    type="number"
                                    min="1"
                                    max="1000000"
                                    value={data.requested_quantity ?? ''}
                                    onChange={(event) =>
                                        setData(
                                            'requested_quantity',
                                            event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                        )
                                    }
                                    className="w-full border-b border-[#070E01]/20 bg-transparent py-2 font-serif text-lg outline-none"
                                />
                                <InputError
                                    message={errors.requested_quantity}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                        <label
                            htmlFor="inquiry-name"
                            className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                        >
                            Full Name
                        </label>
                        <input
                            id="inquiry-name"
                            type="text"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            className="w-full bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                            placeholder="Your name"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                        <label
                            htmlFor="inquiry-email"
                            className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                        >
                            Email Address
                        </label>
                        <input
                            id="inquiry-email"
                            type="email"
                            value={data.email}
                            onChange={(event) =>
                                setData('email', event.target.value)
                            }
                            className="w-full bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                            placeholder="email@address.com"
                            required
                        />
                        <InputError message={errors.email} />
                    </div>
                </div>
                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                    <label
                        htmlFor="inquiry-phone"
                        className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                    >
                        Phone (optional)
                    </label>
                    <input
                        id="inquiry-phone"
                        type="tel"
                        value={data.phone}
                        onChange={(event) =>
                            setData('phone', event.target.value)
                        }
                        className="w-full bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                        placeholder="+251 ..."
                    />
                    <InputError message={errors.phone} />
                </div>
                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                    <label
                        htmlFor="inquiry-interest"
                        className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                    >
                        Interest
                    </label>
                    <select
                        id="inquiry-interest"
                        value={data.interest}
                        onChange={(event) =>
                            setData(
                                'interest',
                                event.target
                                    .value as (typeof interests)[number],
                            )
                        }
                        className="w-full cursor-pointer appearance-none bg-transparent font-serif text-xl outline-none"
                    >
                        {interests.map((interest) => (
                            <option key={interest}>{interest}</option>
                        ))}
                    </select>
                    <InputError message={errors.interest} />
                </div>
                <div className="hidden" aria-hidden="true">
                    <label htmlFor="inquiry-website">Website</label>
                    <input
                        id="inquiry-website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={data.website}
                        onChange={(event) =>
                            setData('website', event.target.value)
                        }
                    />
                </div>
                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                    <label
                        htmlFor="inquiry-message"
                        className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase"
                    >
                        Message
                    </label>
                    <textarea
                        id="inquiry-message"
                        value={data.message}
                        onChange={(event) =>
                            setData('message', event.target.value)
                        }
                        className="h-32 w-full resize-none bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                        placeholder="Tell us what you need..."
                        required
                    />
                    <InputError message={errors.message} />
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#070E01] py-6 text-[10px] font-bold tracking-[0.5em] text-[#ECF3E5] uppercase transition-colors duration-500 hover:bg-[#2D5016] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Sending...' : 'Submit Inquiry'}
                </button>
                {recentlySuccessful && (
                    <p className="text-center text-sm font-medium text-[#2D5016]">
                        Thank you. Danob will be in touch soon.
                    </p>
                )}
            </div>
        </form>
    );
}
