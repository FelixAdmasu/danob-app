import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';
/* @chisel-passkeys */
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import PasskeyVerify from '@/components/passkey-verify';
/* @end-chisel-passkeys */

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            {/* @chisel-passkeys */}
            <div className="login-passkey-wrap">
                <PasskeyVerify
                    routes={{
                        options: confirmOptions(),
                        submit: confirmStore(),
                    }}
                    label="Confirm with passkey"
                    loadingLabel="Confirming..."
                    separator="Or confirm with password"
                />
            </div>
            {/* @end-chisel-passkeys */}

            <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-0">
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#070E01]/50"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    autoFocus
                                    className="h-13 bg-white border border-[#070E01]/15 rounded-2xl text-[14px] text-[#070E01] placeholder:text-[#070E01]/20 focus:outline-none focus:border-[#2D5016]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,80,22,0.06)] transition-all duration-200"
                                />
                                <InputError message={errors.password} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 h-13 w-full bg-[#070E01] hover:bg-[#2D5016] text-[#ECF3E5] text-[13px] font-semibold tracking-[0.15em] uppercase rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(7,14,1,0.12)] hover:shadow-[0_4px_20px_rgba(45,80,22,0.2)]"
                            disabled={processing}
                            data-test="confirm-password-button"
                        >
                            {processing && <Spinner />}
                            Confirm
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm password',
    description: 'Please confirm your password to continue',
};
