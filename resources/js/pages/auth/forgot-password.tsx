// Components
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />

            {status && (
                <div className="mb-6 rounded-2xl border border-[#2D5016]/10 bg-[#2D5016]/5 px-4 py-3 text-center text-[13px] font-medium text-[#2D5016]">
                    {status}
                </div>
            )}

            <Form {...email.form()} className="flex flex-col gap-0">
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-[11px] font-semibold tracking-[0.2em] text-[#070E01]/50 uppercase"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="name@company.com"
                                    className="h-13 rounded-2xl border border-[#070E01]/15 bg-white text-[14px] text-[#070E01] transition-all duration-200 placeholder:text-[#070E01]/20 focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] focus:outline-none"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 h-13 w-full cursor-pointer rounded-2xl bg-[#070E01] text-[13px] font-semibold tracking-[0.15em] text-[#ECF3E5] uppercase shadow-[0_2px_12px_rgba(7,14,1,0.12)] transition-all duration-300 hover:bg-[#2D5016] hover:shadow-[0_4px_20px_rgba(45,80,22,0.2)]"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Send reset link
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-6 text-center">
                <span className="text-[13px] text-[#070E01]/30">
                    Remember your password?{' '}
                </span>
                <TextLink
                    href={login()}
                    className="text-[13px] font-semibold text-[#2D5016] transition-colors hover:text-[#1A3A0A]"
                >
                    Log in
                </TextLink>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: "Enter your email and we'll send you a reset link",
};
