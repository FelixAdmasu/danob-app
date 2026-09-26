<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const MANAGEABLE_ROLES = ['admin', 'manager', 'staff'];

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', Rule::in(array_merge(self::MANAGEABLE_ROLES, ['super_admin']))],
        ]);

        $users = User::query()
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($where) use ($search): void {
                    $where->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($validated['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $validated['search'] ?? null,
                'role' => $validated['role'] ?? null,
            ],
            'roles' => $this->rolesFor($request->user()),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => $this->rolesFor($request->user()),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request, true);
        $this->assertRoleMayManage($request->user(), $validated['role']);

        $user = new User;
        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);
        $user->password = $validated['password'];
        $user->email_verified_at = now();
        $user->save();

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    public function edit(Request $request, User $user): Response
    {
        $this->assertTargetMayBeManaged($request->user(), $user);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user->only(['id', 'name', 'email', 'role']),
            'roles' => $this->rolesFor($request->user()),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->assertTargetMayBeManaged($request->user(), $user);
        $validated = $this->validated($request, false, $user);
        $this->assertRoleMayManage($request->user(), $validated['role']);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);
        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }
        $user->save();

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    private function validated(Request $request, bool $creating, ?User $user = null): array
    {
        $emailRule = Rule::unique('users', 'email');
        if ($user) {
            $emailRule = $emailRule->ignore($user->id);
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', $emailRule],
            'role' => ['required', 'string', Rule::in(array_merge(self::MANAGEABLE_ROLES, ['super_admin']))],
            'password' => $creating
                ? ['required', 'confirmed', Password::defaults()]
                : ['nullable', 'confirmed', Password::defaults()],
        ]);
    }

    private function rolesFor(User $actor): array
    {
        return $actor->isSuperAdmin()
            ? array_merge(self::MANAGEABLE_ROLES, ['super_admin'])
            : self::MANAGEABLE_ROLES;
    }

    private function assertRoleMayManage(User $actor, string $role): void
    {
        abort_unless($actor->isSuperAdmin() || in_array($role, self::MANAGEABLE_ROLES, true), 403);
    }

    private function assertTargetMayBeManaged(User $actor, User $target): void
    {
        abort_unless(! $target->isSuperAdmin() || $actor->isSuperAdmin(), 403);
    }
}
