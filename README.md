# Danob

Danob is a Laravel + React business application for Danob Trading PLC. It combines a public product catalog with authenticated operations for sales, inventory, purchasing, reporting, and notifications.

## Production architecture

```text
GitHub + OpenCode
        |
        | pull requests and GitHub Actions
        v
Render (Laravel/React application)
        |
        +--> Supabase PostgreSQL (the only production database)
        |
        +--> Supabase Storage (durable product, branch, category, and profile images)
```

- **GitHub** is the source of truth for application code and pull requests.
- **OpenCode** is a development helper. It does not run in production and must not receive production secrets.
- **Render** builds and runs the Dockerized Laravel application.
- **Supabase PostgreSQL** stores all production application data.
- **Supabase Storage** stores durable uploaded files. Render's local filesystem is ephemeral.

## Stack

- PHP 8.4+
- Laravel 13
- React 19, TypeScript, Inertia.js
- Tailwind CSS 4 and Radix UI
- PostgreSQL in production; SQLite is convenient for local development
- Docker and FrankenPHP on Render
- Supabase Storage through the S3-compatible filesystem driver

## Main capabilities

- Public products, brands, categories, branches, and informational pages
- Role-aware admin shell for `super_admin`, `admin`, `manager`, and `staff`
- Products, variants, images, categories, brands, and branches
- Customers and sales orders
- Order confirmation, delivery, cancellation, and sales returns
- Opening stock, adjustments, stock ledger, low-stock monitoring, and alerts
- Suppliers, purchase orders, partial receiving, and purchase dashboards
- Operational reports and CSV exports
- Global search and database notifications
- Fortify authentication, email verification, two-factor authentication, and passkeys

## Local setup

Requirements:

- PHP 8.4 or newer
- Composer 2
- Node.js 22 and npm
- SQLite, PostgreSQL, or another supported Laravel database

```bash
git clone https://github.com/FelixAdmasu/Danob.git
cd Danob
composer setup
php artisan storage:link
npm run dev
```

For a normal local setup, `.env.example` uses SQLite and local file storage. For production-like testing, configure PostgreSQL and Supabase Storage in `.env` without committing the values.

Useful commands:

```bash
composer test             # formatting, static analysis, and PHPUnit
composer ci:check         # frontend checks, PHPStan, and tests
npm run build             # production frontend build
npm run types:check       # TypeScript check
```

## Roles and first administrator

New public registrations are always created as `staff`. Do not add an admin role to the registration form. The controlled first-administrator procedure is documented in [`docs/first-admin.md`](docs/first-admin.md).

## Environment configuration

### Production database

Render should connect directly to the Supabase PostgreSQL instance. The production database variables are configured in Render, not committed to GitHub:

```env
DB_CONNECTION=pgsql
DB_HOST=...
DB_PORT=5432
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
DB_SSLMODE=require
```

There should be one authoritative production database: Supabase PostgreSQL. Do not create a second independent production database on Render.

### Production file storage

Uploaded files must use Supabase Storage in production:

```env
FILESYSTEM_DISK_PRODUCT_IMAGES=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ACCESS_KEY_ID=...
SUPABASE_SECRET_ACCESS_KEY=...
SUPABASE_BUCKET=product-images
SUPABASE_DEFAULT_REGION=us-east-1
SUPABASE_USE_PATH_STYLE_ENDPOINT=true
```

The bucket must be public if the application serves public image URLs. Never expose Supabase access keys through `VITE_*` variables or React code. See [`docs/storage.md`](docs/storage.md) for setup and redeploy verification.

### Mail

The Render blueprint currently defaults mail to the log driver. Configure SMTP separately if email delivery is required; database notifications do not require SMTP.

## Render deployment

`render.yaml` defines the production service and declares:

- PHP 8.4 through the Dockerfile's FrankenPHP base image
- Supabase PostgreSQL connection variables
- Database-backed sessions, cache, and queue
- Supabase Storage configuration
- `/up` as the health-check path

The container entrypoint runs migrations, clears stale caches, creates the storage link, and starts FrankenPHP. Before a production deployment, confirm the actual values in the Render service dashboard, especially database credentials, `APP_KEY`, `APP_URL`, and Supabase Storage credentials.

## GitHub and pull-request workflow

Do not develop directly on `main`.

1. Create a feature or maintenance branch from `main`.
2. Make changes with OpenCode or manually.
3. Run the relevant local checks.
4. Push the branch to GitHub.
5. Open a pull request into `main`.
6. Wait for the `tests` GitHub Actions check to pass.
7. Review the diff and deployment-sensitive changes.
8. Merge only after the checks and review are complete.
9. Let Render deploy the resulting `main` commit.

The GitHub Actions workflow runs on pushes to `main` and on pull requests. It uses PHP 8.4, Node.js 22, Composer setup, frontend checks, TypeScript checks, and PHPUnit. The stricter PHPStan suite remains available through the full local `composer test` command.

Recommended branch names:

```text
feat/<short-description>
fix/<short-description>
ops/<short-description>
```

## Verification checklist

Before considering a deployment complete:

- [ ] GitHub Actions passes on the pull request.
- [ ] Render is connected to the intended repository and `main` branch.
- [ ] Render uses the production Dockerfile.
- [ ] `DB_CONNECTION=pgsql` and all Supabase PostgreSQL variables are present in Render.
- [ ] `DB_SSLMODE=require` is enabled.
- [ ] `FILESYSTEM_DISK_PRODUCT_IMAGES=supabase` is present.
- [ ] Supabase Storage credentials and the `product-images` bucket are configured.
- [ ] The first administrator has been promoted through the controlled procedure.
- [ ] A product image upload succeeds.
- [ ] The uploaded image still loads after a Render redeploy.
- [ ] The application health check at `/up` is healthy.
- [ ] No production secret is present in GitHub files, logs, or frontend bundles.

## Repository notes

- `render.yaml` is the committed deployment blueprint.
- `docs/storage.md` explains durable image storage and the production guard.
- `docs/first-admin.md` explains safe administrator provisioning.
- `.github/workflows/tests.yml` is the pull-request and main-branch CI workflow.
