import { Form, Head, router, usePage } from '@inertiajs/react';
/* @chisel-email-verification */
import { Link } from '@inertiajs/react';
/* @end-chisel-email-verification */
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import { update as updateAvatar } from '@/routes/profile/avatar';
import { Loader2, Trash2, Upload } from 'lucide-react';
import type { Auth } from '@/types';
/* @chisel-email-verification */
import { send } from '@/routes/verification';
/* @end-chisel-email-verification */

type PageProps = {
    auth: Auth;
};

export default function Profile(
    /* @chisel-email-verification */
    {
        mustVerifyEmail,
        status,
    }: {
        mustVerifyEmail: boolean;
        status?: string;
    },
    /* @end-chisel-email-verification */
) {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarAction, setAvatarAction] = useState<
        'upload' | 'remove' | null
    >(null);
    const [avatarErrors, setAvatarErrors] = useState<{ avatar?: string }>({});

    const uploadAvatar = (file: File) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('avatar', file);

        setAvatarAction('upload');
        setAvatarErrors({});

        router.post(updateAvatar().url, formData, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => setAvatarErrors(errors as { avatar?: string }),
            onFinish: () => setAvatarAction(null),
        });
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = '';

        if (file) {
            uploadAvatar(file);
        }
    };

    const removeAvatar = () => {
        setAvatarAction('remove');
        setAvatarErrors({});

        router.put(
            updateAvatar().url,
            { remove_avatar: 1 },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setAvatarErrors(errors as { avatar?: string }),
                onFinish: () => setAvatarAction(null),
            },
        );
    };

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile photo"
                    description="Shown across your account. Until you add one, your name initials appear instead."
                />

                <div className="flex items-center gap-5">
                    <Avatar className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
                        <AvatarImage
                            src={auth.user.avatar ?? undefined}
                            alt={auth.user.name}
                        />
                        <AvatarFallback className="dark:bg-secondary dark:text-secondary-foreground rounded-full bg-neutral-200 text-xl font-medium text-black">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={avatarAction !== null}
                                onClick={() => avatarInputRef.current?.click()}
                                data-test="upload-avatar-button"
                            >
                                {avatarAction === 'upload' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                Upload photo
                            </Button>

                            {auth.user.avatar && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={avatarAction !== null}
                                    onClick={removeAvatar}
                                    data-test="remove-avatar-button"
                                >
                                    {avatarAction === 'remove' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Remove
                                </Button>
                            )}
                        </div>

                        <p className="text-muted-foreground text-xs">
                            JPG, PNG or WEBP up to 5 MB.
                        </p>

                        <InputError message={avatarErrors.avatar} />
                    </div>

                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                        data-test="avatar-file-input"
                    />
                </div>
            </div>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {/* @chisel-email-verification */}
                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="text-muted-foreground -mt-4 text-sm">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground decoration-border underline underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-[#95E6B6]">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}
                            {/* @end-chisel-email-verification */}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
