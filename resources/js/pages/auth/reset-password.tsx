import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-0"
            >
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
                                    autoComplete="email"
                                    value={email}
                                    readOnly
                                    className="h-13 cursor-not-allowed rounded-2xl border border-[#070E01]/8 bg-[#070E01]/3 text-[14px] text-[#070E01]/50"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-[11px] font-semibold tracking-[0.2em] text-[#070E01]/50 uppercase"
                                >
                                    New password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Create a new password"
                                    passwordrules={passwordRules}
                                    className="h-13 rounded-2xl border border-[#070E01]/15 bg-white text-[14px] text-[#070E01] transition-all duration-200 placeholder:text-[#070E01]/20 focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] focus:outline-none"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-[11px] font-semibold tracking-[0.2em] text-[#070E01]/50 uppercase"
                                >
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    passwordrules={passwordRules}
                                    className="h-13 rounded-2xl border border-[#070E01]/15 bg-white text-[14px] text-[#070E01] transition-all duration-200 placeholder:text-[#070E01]/20 focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] focus:outline-none"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 h-13 w-full cursor-pointer rounded-2xl bg-[#070E01] text-[13px] font-semibold tracking-[0.15em] text-[#ECF3E5] uppercase shadow-[0_2px_12px_rgba(7,14,1,0.12)] transition-all duration-300 hover:bg-[#2D5016] hover:shadow-[0_4px_20px_rgba(45,80,22,0.2)]"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Reset password
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Choose a new password for your account',
};
