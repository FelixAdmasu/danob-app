import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */
import { store } from '@/routes/login';
import { request } from '@/routes/password';
/* @chisel-passkeys */
import PasskeyVerify from '@/components/passkey-verify';
/* @end-chisel-passkeys */

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            {/* @chisel-passkeys */}
            <div className="login-passkey-wrap">
                <PasskeyVerify />
            </div>
            {/* @end-chisel-passkeys */}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-0"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#070E01]/50"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="name@company.com"
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#070E01]/50"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-[11px] text-[#070E01]/30 hover:text-[#2D5016] transition-colors"
                                            tabIndex={5}
                                        >
                                            Forgot?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter password"
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-[#070E01]/15 data-[state=checked]:bg-[#2D5016] data-[state=checked]:border-[#2D5016]"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-[13px] text-[#070E01]/40 cursor-pointer"
                                >
                                    Remember me
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 h-13 w-full bg-[#070E01] hover:bg-[#2D5016] text-[#ECF3E5] text-[13px] font-semibold tracking-[0.15em] uppercase rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(7,14,1,0.12)] hover:shadow-[0_4px_20px_rgba(45,80,22,0.2)]"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            Log in
                        </Button>

                        {/* @chisel-registration */}
                        <div className="mt-6 text-center">
                            <span className="text-[13px] text-[#070E01]/30">
                                Don't have an account?{' '}
                            </span>
                            <TextLink
                                href={register()}
                                tabIndex={5}
                                className="text-[13px] text-[#2D5016] hover:text-[#1A3A0A] font-semibold transition-colors"
                            >
                                Sign up
                            </TextLink>
                        </div>
                        {/* @end-chisel-registration */}

                        {status && (
                            <div className="mt-4 text-center text-[13px] font-medium text-[#2D5016]">
                                {status}
                            </div>
                        )}
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Sign in to your Danob account',
};
