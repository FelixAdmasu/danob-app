import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import UserForm from './Form';

type Props = { roles: string[]; passwordRules: string };

export default function Create({ roles, passwordRules }: Props) {
    return (
        <>
            <Head title="Create user" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Administration"
                    title="Create user"
                    description="Add a verified Danob team account with an appropriate role."
                />
                <UserForm roles={roles} passwordRules={passwordRules} />
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Users', href: '/admin/users' },
        { title: 'Create', href: '/admin/users/create' },
    ],
};
