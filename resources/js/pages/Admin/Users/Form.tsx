import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type UserValues = {
    id?: number;
    name: string;
    email: string;
    role: string;
};

type Props = {
    user?: UserValues;
    roles: string[];
    passwordRules: string;
};

const labelFor = (value: string) =>
    value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function UserForm({ user, roles, passwordRules }: Props) {
    const editing = Boolean(user);
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? roles[roles.length - 1] ?? 'staff',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true };
        if (editing && user) {
            form.put(`/admin/users/${user.id}`, options);
        } else {
            form.post('/admin/users', options);
        }
    };

    return (
        <form onSubmit={submit} className="max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {editing ? 'User details' : 'Create a user'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            required
                        />
                        {form.errors.name && (
                            <p className="text-destructive text-sm">
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            required
                        />
                        {form.errors.email && (
                            <p className="text-destructive text-sm">
                                {form.errors.email}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={form.data.role}
                            onValueChange={(value) =>
                                form.setData('role', value)
                            }
                        >
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {labelFor(role)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.role && (
                            <p className="text-destructive text-sm">
                                {form.errors.role}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {editing
                                    ? 'New password (optional)'
                                    : 'Password'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                required={!editing}
                            />
                            {form.errors.password && (
                                <p className="text-destructive text-sm">
                                    {form.errors.password}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                required={
                                    !editing && Boolean(form.data.password)
                                }
                            />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {passwordRules}
                    </p>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Saving...'
                                : editing
                                  ? 'Save changes'
                                  : 'Create user'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
