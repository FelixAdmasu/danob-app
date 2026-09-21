import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-0"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#070E01]/50"
                                >
                                    Full name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Your full name"
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.name} />
                            </div>

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
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#070E01]/50"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Create a password"
                                    passwordrules={passwordRules}
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#070E01]/50"
                                >
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Repeat password"
                                    passwordrules={passwordRules}
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 h-13 w-full bg-[#070E01] hover:bg-[#2D5016] text-[#ECF3E5] text-[13px] font-semibold tracking-[0.15em] uppercase rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(7,14,1,0.12)] hover:shadow-[0_4px_20px_rgba(45,80,22,0.2)]"
                            tabIndex={5}
                            data-test="register-user-button"
                        >
                            {processing && <Spinner />}
                            Create account
                        </Button>

                        <div className="mt-6 text-center">
                            <span className="text-[13px] text-[#070E01]/30">
                                Already have an account?{' '}
                            </span>
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="text-[13px] text-[#2D5016] hover:text-[#1A3A0A] font-semibold transition-colors"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Join Danob to manage your orders and account',
};
