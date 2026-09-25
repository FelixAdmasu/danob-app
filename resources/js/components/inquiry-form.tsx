import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';

const interests = [
    'Product Inquiry',
    'Branch Visit',
    'Wholesale Order',
    'Partnership',
] as const;

type InquiryFormProps = {
    compact?: boolean;
};

export default function InquiryForm({ compact = false }: InquiryFormProps) {
    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm({
            name: '',
            email: '',
            phone: '',
            interest: 'Product Inquiry',
            message: '',
            website: '',
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
                }),
        });
    };

    return (
        <form
            onSubmit={submit}
            className={`rounded-[16px] border border-[#070E01]/10 bg-white p-8 md:p-12 ${compact ? '' : 'lg:w-1/2'}`}
        >
            <div className="space-y-8 md:space-y-12">
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
