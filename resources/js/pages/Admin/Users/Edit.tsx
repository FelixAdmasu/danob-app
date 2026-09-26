import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import UserForm from './Form';

type User = { id: number; name: string; email: string; role: string };
type Props = { user: User; roles: string[]; passwordRules: string };

export default function Edit({ user, roles, passwordRules }: Props) {
    return (
        <>
            <Head title={`Edit ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Administration"
                    title={`Edit ${user.name}`}
                    description="Update account details, role, or reset the password."
                />
                <UserForm
                    user={user}
                    roles={roles}
                    passwordRules={passwordRules}
                />
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Users', href: '/admin/users' },
        { title: 'Edit', href: '#' },
    ],
};
