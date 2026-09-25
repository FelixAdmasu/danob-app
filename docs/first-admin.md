# First administrator provisioning

New registrations intentionally create `staff` users. This prevents a public visitor from registering an administrator account. Promote the first administrator through a controlled database operation after the application is deployed.

## Recommended procedure

1. Create the intended user through the normal registration flow, or identify an existing verified user.
2. Confirm the exact email address and ensure it belongs to the organization.
3. In the Render service dashboard, open the service Shell for the production application.
4. Run the following read-only lookup first:

    ```bash
    php artisan tinker --execute="echo App\\Models\\User::where('email', 'admin@example.com')->value('id') ?? 'NOT_FOUND';"
    ```

5. If the expected user ID is returned, promote that exact account. Prefer the application model so the operation goes through Laravel's configured database connection:

    ```bash
    php artisan tinker --execute="App\\Models\\User::where('email', 'admin@example.com')->update(['role' => 'super_admin']);"
    ```

6. Verify the role without printing the password or other private fields:

    ```bash
    php artisan tinker --execute="echo App\\Models\\User::where('email', 'admin@example.com')->value('role');"
    ```

7. Sign in with that account, complete email verification and two-factor setup, and confirm access to the admin dashboard.
8. Keep the account email and promotion date in the organization's internal administrative record.

Replace `admin@example.com` with the real address. Do not paste a real production email address or database password into GitHub, source files, OpenCode prompts, or public issue comments.

## Safety rules

- Do not add administrator role selection to public registration.
- Do not run an unqualified update such as `update users set role = ...`.
- Confirm the exact email address before running the update.
- Take or confirm a current Supabase database backup before a production administration change.
- Use `super_admin` for the first owner-level account. The application treats it as authorized for all current role-gated areas.
- After the first account is secured, create additional staff accounts normally and manage access through an internal process.

## If the user does not exist

Stop and create the account through the normal registration flow first. Do not insert a user manually unless there is a documented recovery procedure and the password is generated and handled securely.

## Recovery

If the account is promoted incorrectly, run the same targeted command with the intended role after confirming the exact account:

```bash
php artisan tinker --execute="App\\Models\\User::where('email', 'admin@example.com')->update(['role' => 'staff']);"
```

For a production recovery involving a lost account or inaccessible email, use the organization's approved identity and database recovery process. Do not disable authentication protections in the application or expose a public promotion endpoint.
