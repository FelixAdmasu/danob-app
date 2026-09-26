# Danob — Complete System Documentation

**Danob** is a full-featured, modern business application built for **Danob Trading PLC**. It combines a public product storefront with a role-aware admin dashboard covering sales, inventory, purchasing, reporting, and customer management.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Public Storefront](#public-storefront)
5. [Admin Dashboard](#admin-dashboard)
6. [Navigation Structure](#navigation-structure)
7. [Modules & Pages Reference](#modules--pages-reference)
   - [Dashboard](#dashboard)
   - [Catalog](#catalog)
   - [Operations](#operations)
   - [Inventory](#inventory)
   - [Sales](#sales)
   - [Reports](#reports)
   - [Administration](#administration)
8. [Roles & Permissions](#roles--permissions)
9. [Design System & UI](#design-system--ui)
10. [Local Development Setup](#local-development-setup)
11. [Production Deployment](#production-deployment)
12. [Environment Configuration](#environment-configuration)
13. [Authentication & Security](#authentication--security)
14. [File Storage](#file-storage)
15. [Email & Notifications](#email--notifications)
16. [Database Queue & Background Jobs](#database-queue--background-jobs)
17. [Verification Checklist](#verification-checklist)
18. [Repository Structure](#repository-structure)
19. [CI/CD Workflow](#cicd-workflow)

---

## System Overview

Danob is a **Laravel 13 + React 19 + Inertia.js** application that provides:

- **Public storefront** — browse products, view details, search, and purchase
- **Admin dashboard** — modern interactive UI with KPIs, charts, activity feeds, and quick actions
- **Catalog management** — products, variants, categories, brands, branches
- **Order management** — create, confirm, deliver, cancel orders; process returns
- **Inventory control** — opening stock, adjustments, full ledger, low-stock alerts
- **Purchasing** — suppliers, purchase orders, partial receiving, purchase dashboards
- **Reporting** — sales, returns, customers, purchases, low stock, inventory movements, supplier analytics
- **Customer management** — customers, inquiries, profiles
- **Administration** — user management, roles, authentication

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 19 + TypeScript + Tailwind CSS 4 + Radix UI Primitives   │
│  Inertia.js (SPA-like, server-rendered via Laravel)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (Inertia)
                           v
┌─────────────────────────────────────────────────────────────────┐
│                      RENDER (Production)                         │
│  Docker + FrankenPHP · PHP 8.4 · Laravel 11/13                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    LARAVEL APPLICATION                      │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │  │
│  │  │  Routes   │  │ Controllers│  │  Auth (Fortify/2FA/ │  │  │
│  │  │  (web.php)│  │           │  │   Passkeys)           │  │  │
│  │  └──────────┘  └──────────┘  └───────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │  │
│  │  │  Models   │  │  Services │  │  Event Listeners      │  │  │
│  │  │  (Eloquent│  │(Inventory │  │  (Notifications,      │  │  │
│  │  │   ORM)    │  │ Service)  │  │   Stock on Order)     │  │  │
│  │  └──────────┘  └──────────┘  └───────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │         Vue/Inertia PAGE COMPONENTS               │  │  │
│  │  │  (React JSX via @inertiajs/react adapter)          │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          v                 v                 v
┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  SUPABASE    │ │  SUPABASE        │ │  SUPABASE        │
│  PostgreSQL  │ │  Storage         │ │  (via S3-        │
│  (Primary    │ │  (Product,       │ │   compatible)    │
│   Database)  │ │   Branch,        │ │                  │
│              │ │   Category,      │ │  S3-compatible   │
│  6543 port   │ │   Profile)       │ │  filesystem      │
│  Pooler      │ │                  │ │  driver          │
└──────────────┘ └──────────────────┘ └──────────────────┘
```

### Component Layers

| Layer | Files | Responsibility |
|---|---|---|
| **Routes** | `routes/web.php` | All URL routing, role-based middleware groups |
| **Controllers** | `app/Http/Controllers/` | Business logic, data fetching, Inertia rendering |
| **Models** | `app/Models/` | Eloquent ORM, relationships, business rules |
| **Services** | `app/Services/` | `InventoryService`, stock operations, order processing |
| **Listeners** | `app/Listeners/` | Event-driven side effects (notifications, stock updates) |
| **Jobs** | `app/Jobs/` | Background processing (email queue, reports) |
| **Page Components** | `resources/js/pages/` | React pages (Inertia.js) |
| **Shared Components** | `resources/js/components/` | Reusable UI primitives (Card, Table, Badge, etc.) |
| **Layouts** | `resources/js/layouts/` | Sidebar, header, content shell |
| **CSS** | `resources/css/app.css` | Global styles, design tokens, animations |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | PHP 8.4+, Laravel 13 |
| **Frontend** | React 19, TypeScript, Inertia.js |
| **Styling** | Tailwind CSS 4 |
| **UI Primitives** | Radix UI (via shadcn/ui components) |
| **Icons** | Lucide React |
| **Database (Production)** | Supabase PostgreSQL (via connection pooler) |
| **Database (Local)** | SQLite / PostgreSQL |
| **File Storage** | Supabase Storage (S3-compatible driver) |
| **Authentication** | Laravel Fortify, email verification, 2FA, passkeys |
| **Containerization** | Docker + FrankenPHP |
| **Deployment** | Render (auto-deploys from GitHub `main`) |
| **CI/CD** | GitHub Actions |
| **Charts** | Pure SVG (no chart library) — `DonutChart`, `BarList` |
| **Fonts** | Inter Tight (sans-serif) + Playfair Display (serif) |
| **Color Palette** | Foundation sage/green (`#2d5016`, `#4a8c2a`, `#7fb069`) |

---

## Public Storefront

The public-facing storefront is accessible at the root URL. It is visible to all users (authenticated and anonymous).

| Page | Path | Description |
|---|---|---|
| **Home** | `/` | Landing page with hero banner, featured products, categories, featured brands |
| **Products Index** | `/products` | Browse all products with debounced search, category/brand filters, price range, stock badges, package quantity selector |
| **Product Detail** | `/products/{slug}` | Product detail with gallery, price, stock status, variant/package table, related products, add-to-cart |
| **Categories** | `/products/categories/{slug}` | Products filtered by category |
| **Brands** | `/products/brands/{slug}` | Products filtered by brand |
| **About** | `/about` | About Danob Trading PLC |
| **How to Order** | `/how-to-order` | Ordering instructions |
| **Contact** | `/contact` | Contact page |
| **Login** | `/login` | Authentication (Fortify) |
| **Register** | `/register` | Public registration (creates `staff` role) |

### Storefront Features
- **Debounced search** — server-side filtering with `LOWER(name) LIKE ?`
- **Out-of-stock chips** — visual badge on unavailable products
- **Package table** — variant/package sizes with quantity selection
- **Related products** — "You may also like" section on product detail
- **Price display** — "From ETB" pricing format
- **Stock badges** — in-stock / low-stock / out-of-stock indicators
- **Image fallback** — graceful placeholder on broken images

---

## Admin Dashboard

The admin dashboard is the central hub for all operations. It features a **modern, interactive UI** with animated KPIs, period selectors, interactive charts, activity feeds, and quick-action tiles.

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Gradient accent bar]                                      │
│                                                             │
│  Good morning, {name}        [Live ●] [10:30] [↻] [New Order]│
│  Dashboard                   │  All time │ Today │ Week │ Month│
│  Orders, inventory & more    │───────────│───────│──────│──────│
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ← Animated KPIs     │
│  │Orders│ │Pending│ │Deliv.│ │Customers│    (count-up)       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │Products│ │Variants│ │InStock│ │Low│                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                             │
│  ┌───────────────┬───────────────┐                         │
│  │ Orders by     │ Stock Health  │  ← Interactive charts   │
│  │ Status        │ (donut)       │                          │
│  │ (bar chart)   │               │                          │
│  └───────────────┴───────────────┘                         │
│                                                             │
│  ┌───────────────────┬───────────────┐                     │
│  │ Recent Activity   │ Quick Actions │  ← Activity feed    │
│  │ (movements)       │ (tiles)       │    + actions        │
│  └───────────────────┴───────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Features
- **Animated counters** — KPIs count up from 0 on load (ease-out cubic)
- **Period selector** — All time / Today / This week / This month (client-side filter)
- **Interactive column chart** — Orders by Status with hover highlights and direct value labels
- **Stock Health donut** — Availability breakdown with progress bar
- **Staggered fade-up entrance** — Cards animate in with cascading delays
- **Gradient accent bar** — Subtle sage-to-green top strip
- **Live indicator** — Pulsing green dot + timestamp
- **Refresh button** — `↻` reloads dashboard data via Inertia
- **Activity feed** — Recent stock movements with color-coded in/out arrows
- **Quick actions** — New Order, Add Product, Low Stock, Purchase Orders tiles

---

## Navigation Structure

The admin sidebar is **role-gated** with six sections. It collapses to icons-only when toggled.

```
Home
└── Dashboard

Catalog          (admin, manager)
├── Products
├── Categories
└── Brands

Operations       (admin, manager)
├── Branches
├── Suppliers
├── Purchase Orders
└── Purchase Dashboard

Inventory        (admin, manager)
├── Opening Stock
├── Stock Adjustments
├── Inventory History
└── Low Stock

Sales            (admin, manager, staff)
├── Orders
├── Customers
├── Inquiries
├── Sales Dashboard
└── Reports

Administration   (super_admin, admin)
└── Users
```

**Footer**: "View Store" link (opens storefront in new tab) + User profile menu

---

## Modules & Pages Reference

### Dashboard
| Page | Path | Roles | Description |
|---|---|---|---|
| **Admin Dashboard** | `/admin` | all authenticated | Main dashboard with KPIs, charts, activity, quick actions |
| **Sales Dashboard** | `/admin/sales/dashboard` | admin, manager, staff | Sales-focused dashboard — orders, deliveries, returns, top customers/products |
| **Purchase Dashboard** | `/admin/purchases/dashboard` | admin, manager | Purchasing dashboard — POs, receiving, supplier activity |

### Catalog
| Page | Path | Roles | Description |
|---|---|---|---|
| **Products Index** | `/admin/products` | admin, manager | Product listing with search, category/brand/status filters, variant counts, low-stock badges, CRUD actions |
| **Create Product** | `/admin/products/create` | admin, manager | Create a new product with variants, images, and inventory data |
| **Edit Product** | `/admin/products/{id}/edit` | admin, manager | Edit product details, variants, and images |
| **Product Detail** | `/admin/products/{id}` | admin, manager | Full product detail with variants, stock info, images, and actions |
| **Categories Index** | `/admin/categories` | admin, manager | Category management — create, edit, delete |
| **Create Category** | `/admin/categories/create` | admin, manager | Create a new category |
| **Edit Category** | `/admin/categories/{id}/edit` | admin, manager | Edit category details |
| **Brands Index** | `/admin/brands` | admin, manager | Brand management — create, edit, delete |
| **Create Brand** | `/admin/brands/create` | admin, manager | Create a new brand |
| **Edit Brand** | `/admin/brands/{id}/edit` | admin, manager | Edit brand details |

### Operations
| Page | Path | Roles | Description |
|---|---|---|---|
| **Branches Index** | `/admin/branches` | admin, manager | Branch management — create, edit, delete, visual location display |
| **Create Branch** | `/admin/branches/create` | admin, manager | Create a new branch |
| **Edit Branch** | `/admin/branches/{id}/edit` | admin, manager | Edit branch details |
| **Suppliers Index** | `/admin/suppliers` | admin, manager | Supplier listing with search/filter, CRUD actions, deactivate/activate |
| **Create Supplier** | `/admin/suppliers/create` | admin, manager | Create a new supplier |
| **Edit Supplier** | `/admin/suppliers/{id}/edit` | admin, manager | Edit supplier details |
| **Supplier Detail** | `/admin/suppliers/{id}` | admin, manager | Supplier detail with order history, deactivate/activate |
| **Purchase Orders Index** | `/admin/purchase-orders` | admin, manager | PO listing with status, supplier, totals, dates, CRUD actions |
| **Create Purchase Order** | `/admin/purchase-orders/create` | admin, manager | Create a new purchase order |
| **Edit Purchase Order** | `/admin/purchase-orders/{id}/edit` | admin, manager | Edit PO details |
| **PO Detail** | `/admin/purchase-orders/{id}` | admin, manager | PO detail with line items, status, actions (submit/approve/cancel/receive) |
| **Receive Goods** | `/admin/purchase-orders/{id}/receive` | admin, manager | Receive goods against a PO (creates stock entries) |

### Inventory
| Page | Path | Roles | Description |
|---|---|---|---|
| **Opening Stock** | `/admin/inventory/opening-stock` | admin, manager | Set initial stock levels for product variants |
| **Stock Adjustments** | `/admin/inventory/adjustments` | admin, manager | Stock adjustment records (add/remove stock with reasons) |
| **Inventory History** | `/admin/inventory/history` | admin, manager | Full inventory movement ledger with filtering |
| **Low Stock** | `/admin/inventory/low-stock` | admin, manager | Low-stock monitoring — variants at or below reorder point |

### Sales
| Page | Path | Roles | Description |
|---|---|---|---|
| **Orders Index** | `/admin/orders` | admin, manager, staff | Order listing with search/status filters, customer, total, status |
| **Create Order** | `/admin/orders/create` | admin, manager, staff | Create a new order (pending status) |
| **Order Detail** | `/admin/orders/{id}` | admin, manager, staff | Order detail with line items, status timeline, actions (confirm/deliver/cancel/return) |
| **Customers Index** | `/admin/customers` | admin, manager, staff | Customer listing with search/filter, CRUD actions |
| **Create Customer** | `/admin/customers/create` | admin, manager, staff | Create a new customer |
| **Edit Customer** | `/admin/customers/{id}/edit` | admin, manager, staff | Edit customer details |
| **Inquiries Index** | `/admin/inquiries` | admin, manager, staff | Customer inquiries with status, update and convert to customer |

### Reports
| Page | Path | Roles | Description |
|---|---|---|---|
| **Reports Index** | `/admin/reports` | admin, manager, staff | Report landing page — grouped by Sales, Inventory, Purchases |
| **Sales Report** | `/admin/reports/sales` | admin, manager, staff | Order data by status, date range, CSV export |
| **Returns Report** | `/admin/reports/returns` | admin, manager, staff | Sales returns data, CSV export |
| **Customers Report** | `/admin/reports/customers` | admin, manager, staff | Customer analytics, CSV export |
| **Purchases Report** | `/admin/reports/purchases` | admin, manager, staff | PO analytics, CSV export |
| **Low Stock Report** | `/admin/reports/low-stock` | admin, manager, staff | Low-stock alert report, CSV export |
| **Inventory Movements Report** | `/admin/reports/inventory-movements` | admin, manager, staff | Inventory movement history, CSV export |
| **Suppliers Report** | `/admin/reports/suppliers` | admin, manager, staff | Supplier performance analytics, CSV export |

### Administration
| Page | Path | Roles | Description |
|---|---|---|---|
| **Users Index** | `/admin/users` | super_admin, admin | User listing with search/filter by role |
| **Create User** | `/admin/users/create` | super_admin, admin | Create a new user account |
| **Edit User** | `/admin/users/{id}/edit` | super_admin, admin | Edit user account |

---

## Roles & Permissions

Danob has four role levels. Every page and action is gated by role.

| Role | Dashboard | Catalog | Operations | Inventory | Sales | Administration |
|---|---|---|---|---|---|---|
| **super_admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Users |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Users |
| **manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **staff** | ✅ | ❌ | ❌ | ❌ | ✅ Orders, Customers, Inquiries | ❌ |
| **public (unauthenticated)** | ✅ Storefront | ✅ Storefront | ❌ | ❌ | ❌ | ❌ |

### Role-Gated Features
- **Staff** can create orders, view customers, submit inquiries
- **Manager+** can manage catalog, operations, inventory, and full sales
- **Admin+** can manage users and all features
- **Public** sees only the storefront
- New public registrations always create `staff` accounts
- First administrator is promoted via a controlled procedure (`docs/first-admin.md`)

---

## Design System & UI

Danob uses a **modern, cohesive design language** with a distinctive sage/green palette.

### Color Palette (CSS Custom Properties)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--primary` | `#2d5016` | `#7fb069` | Primary actions, accents |
| `--chart-1` | `#2d5016` | `#7fb069` | Chart series 1 |
| `--chart-2` | `#4a8c2a` | `#d4e8c8` | Chart series 2 |
| `--chart-3` | `#7fb069` | `#4a8c2a` | Chart series 3 |
| `--viz-success` | `#4a8c2a` | `#95e6b6` | Success states |
| `--viz-warning` | `#d97706` | `#f0b429` | Warning states |
| `--viz-danger` | `#dc2626` | `#f87171` | Danger/error states |
| `--background` | `#ecf3e5` | `#0b1406` | Page background |
| `--card` | `#ffffff` | `#111b0a` | Card surfaces |
| `--border` | `rgba(7,14,1,0.1)` | `#26331c` | Borders |
| `--muted` | `#d4e8c8` | `#1a2812` | Muted backgrounds |
| `--sidebar` | `#ecf3e5` | `#090f05` | Sidebar frame |

### Typography
- **Sans-serif**: Inter Tight (buttons, headings, body)
- **Serif**: Playfair Display (titles, logos, card titles)
- **Weight**: 400–700 (sans), 400–700 (serif)

### Shared Components
All admin pages share a consistent component library:

| Component | Description |
|---|---|
| `Card` | Rounded-2xl surface with hover shadow lift, subtle gradient |
| `Table` | Zebra-striped, sticky header, rounded container, improved hover |
| `Badge` | Pill-shaped status chips with semantic colors (success/warning/danger) |
| `Button` | Rounded, multiple variants (default/outline/ghost/destructive), `active:scale` |
| `StatCard` | Metric KPI tile — icon chip + bold value + trend pill + hint + progress |
| `Heading` | Page header with eyebrow + title + description + action slot |
| `Panel` | Reusable panel card with title/subtitle/action header pattern |
| `ProgressBar` | Animated progress meter with tone colors and value readout |
| `DonutChart` | Pure SVG ring chart for status/product mix |
| `BarList` | Pure SVG horizontal bar chart for comparisons |
| `EmptyState` | Friendly illustration + title + description + optional CTA |
| `Pagination` | Modern pill buttons with active state |
| `FilterPanel` | Responsive filter bar with labels, actions, active-count hint |
| `StatusBadge` | Maps status strings to color-coded badges |

### Animations
- **fade-up** — Staggered card entrance (opacity + translateY)
- **bar-grow** — Progress bar / bar chart horizontal grow
- **grow-up** — Column chart vertical grow
- **table-pending-pulse** — Table dim/shimmer during Inertia data loads
- **count-up** — Animated counter on KPIs (ease-out cubic)
- **pulse** — Live indicator dot

---

## Local Development Setup

### Requirements
- PHP 8.4 or newer
- Composer 2
- Node.js 22 and npm
- SQLite (default), PostgreSQL, or another Laravel-supported database

### Quick Start
```bash
git clone https://github.com/FelixAdmasu/Danob.git
cd Danob
composer setup
php artisan storage:link
npm run dev
```

### Useful Commands
```bash
composer test          # formatting, static analysis, and PHPUnit
composer ci:check      # frontend checks, PHPStan, and tests
npm run build          # production frontend build
npm run types:check    # TypeScript check
npm run types:build    # TypeScript build
```

### Local Database
The default `.env.example` uses SQLite. For production-like testing, configure PostgreSQL and Supabase Storage in `.env` without committing values.

---

## Production Deployment

Danob deploys automatically via **Render** from GitHub `main`. The deployment blueprint is defined in `render.yaml`.

### Deployment Flow
```
GitHub `main` push
       │
       v
Render auto-deploys (Docker + FrankenPHP)
       │
       v
Container entrypoint:
  1. Run migrations
  2. Clear stale caches
  3. Create storage link
  4. Start FrankenPHP
       │
       v
Health check at `/up`
```

### Render Service Configuration (`render.yaml`)
- PHP 8.4 via Docker + FrankenPHP
- Supabase PostgreSQL connection variables
- Database-backed sessions, cache, and queue
- Supabase Storage configuration
- `/up` health-check path

### Pre-Deployment Verification
- `DB_CONNECTION=pgsql` with all Supabase PostgreSQL variables present
- `DB_SSLMODE=require` enabled
- `FILESYSTEM_DISK_PRODUCT_IMAGES=supabase` present
- Supabase Storage credentials and `product-images` bucket configured
- `APP_KEY`, `APP_URL`, and database credentials verified in Render dashboard
- No production secrets in GitHub files, logs, or frontend bundles

---

## Environment Configuration

### Production Database
Render connects directly to the Supabase PostgreSQL instance via the connection pooler:

```env
DB_CONNECTION=pgsql
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<your-password>
DB_SSLMODE=require
```

**Important**: There should be one authoritative production database — Supabase PostgreSQL. Do not create a second independent production database on Render.

### Production File Storage
All uploaded files use Supabase Storage:

```env
FILESYSTEM_DISK_PRODUCT_IMAGES=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ACCESS_KEY_ID=<access-key>
SUPABASE_SECRET_ACCESS_KEY=<secret-key>
SUPABASE_BUCKET=product-images
SUPABASE_DEFAULT_REGION=us-east-1
SUPABASE_USE_PATH_STYLE_ENDPOINT=true
```

The bucket must be **public** if the application serves public image URLs. Never expose Supabase access keys through `VITE_*` variables or React code.

### Mail
The Render blueprint defaults mail to the `log` driver. Configure SMTP separately if email delivery is required. Database notifications do not require SMTP.

### Session & Cache
Production uses database-backed sessions, cache, and queue — configured in `render.yaml` and `.env`.

---

## Authentication & Security

### Authentication Flow
- **Laravel Fortify** — stateless authentication
- **Email verification** — required for admin access
- **Two-factor authentication** — TOTP setup and recovery codes
- **Passkeys** — WebAuthn-based passwordless authentication
- **Session management** — database-backed sessions with expiration

### Security Notes
- All admin routes require `auth` + `verified` middleware
- Role-based access control via middleware on every route group
- Supabase credentials are configured in **Render**, never committed to GitHub
- `render.yaml` is the committed deployment blueprint
- `docs/first-admin.md` documents safe administrator provisioning
- `docs/storage.md` explains durable image storage and production guards

### Credential Rotation
- Rotate Supabase DB password and API keys periodically
- Never paste credentials in chat or commit them to Git
- Update credentials in Render dashboard, not in `.env` on the server

---

## File Storage

### Architecture
- **Production**: Supabase Storage (S3-compatible filesystem driver)
- **Local**: Local file storage with `php artisan storage:link`
- **Ephemeral**: Render's local filesystem is ephemeral — always use Supabase Storage for persistent files

### Supported File Types
- **Product images** — stored in `product-images` bucket
- **Branch images** — stored via Supabase Storage
- **Category images** — stored via Supabase Storage
- **Profile images** — stored via Supabase Storage

### Image Fallback
If a stored image fails to load, the application displays a muted placeholder (gentle backdrop + centered image icon) using the `--muted` theme token.

---

## Email & Notifications

### Mail Configuration
- Default driver: `log` (Render blueprint)
- Configure SMTP for actual email delivery
- Database notifications do not require SMTP

### Notification Types
- **Database notifications** — stored in the database, shown in the admin notification center
- **Email notifications** — delivered via SMTP when configured

### Key Events
- Order status changes (confirmed, delivered, cancelled)
- Purchase order events (submitted, approved, received)
- Stock adjustments
- Customer inquiries
- Account registration and verification

### Email Boundaries
- Customer-facing emails are sent from no-reply addresses
- Internal notifications are sent to admin accounts
- See `docs/email.md` for the complete event-to-email mapping

---

## Database Queue & Background Jobs

### Queue Architecture
- **Driver**: Database queue
- **Purpose**: Async processing for email delivery, report generation, and other time-consuming tasks
- **After-commit delivery**: Jobs are dispatched after database transactions commit

### Job Types
- **Email delivery** — queued and retried; failed jobs tracked in `failed_jobs`
- **Report generation** — CSV exports processed asynchronously
- **Stock processing** — inventory operations that need background handling

### Retry & Failed Jobs
- Jobs automatically retry on failure
- Failed jobs are stored in the `failed_jobs` table for review
- See `docs/queue.md` for the complete queue documentation

---

## Verification Checklist

Before considering a deployment complete:

- [ ] GitHub Actions passes on the pull request
- [ ] Render is connected to the intended repository and `main` branch
- [ ] Render uses the production Dockerfile
- [ ] `DB_CONNECTION=pgsql` and all Supabase PostgreSQL variables present in Render
- [ ] `DB_SSLMODE=require` is enabled
- [ ] `FILESYSTEM_DISK_PRODUCT_IMAGES=supabase` is present
- [ ] Supabase Storage credentials and the `product-images` bucket configured
- [ ] The first administrator promoted through the controlled procedure
- [ ] Product image upload succeeds
- [ ] Uploaded image loads after a Render redeploy
- [ ] Application health check at `/up` is healthy
- [ ] No production secret present in GitHub files, logs, or frontend bundles

---

## Repository Structure

```
danob-app/
├── app/                          # Laravel application core
│   ├── Http/Controllers/         # Controllers (admin, public, auth)
│   ├── Models/                   # Eloquent models
│   ├── Services/                 # Business services (InventoryService, etc.)
│   ├── Listeners/                # Event listeners
│   ├── Jobs/                     # Background jobs
│   ├── Rules/                    # Custom validation rules
│   └── Providers/                # Service providers
├── bootstrap/                    # Application bootstrap
├── config/                       # Laravel configuration
├── database/                     # Migrations and seeders
├── docs/                         # Documentation
│   ├── first-admin.md            # First administrator provisioning
│   ├── storage.md                # Image storage configuration
│   ├── email.md                  # Email configuration and events
│   └── queue.md                  # Queue and background jobs
├── public/                       # Public assets and build output
│   └── build/                    # Compiled frontend assets
├── resources/
│   ├── css/                      # Global styles and design tokens
│   │   └── app.css               # Tailwind + custom styles + animations
│   ├── js/                       # React/TypeScript frontend
│   │   ├── components/           # Shared components (ui, layout, charts)
│   │   ├── layouts/              # App layouts (sidebar, header)
│   │   ├── pages/                # Page components
│   │   │   └── Admin/            # All admin pages (dashboards, CRUD, reports)
│   │   └── routes/               # Auto-generated route files (wayfinder)
│   └── views/                    # Laravel Blade views (if any)
├── routes/                       # Route definitions
│   └── web.php                   # All application routes
├── render.yaml                   # Render deployment blueprint
├── storage/                      # Local storage (symlinked)
├── tests/                        # PHPUnit tests
├── vendor/                       # Composer dependencies
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── composer.json                 # PHP dependencies
├── package.json                  # Node.js dependencies
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
└── README.md                     # This file
```

---

## CI/CD Workflow

### Branch Strategy
- **`main`** — Production-ready code (protected)
- **Feature branches** — `feat/<short-description>`
- **Fix branches** — `fix/<short-description>`
- **Ops branches** — `ops/<short-description>`

### Workflow
1. Create a feature branch from `main`
2. Make changes with OpenCode or manually
3. Run local checks (`composer test`, `npm run build`)
4. Push branch to GitHub
5. Open a pull request into `main`
6. Wait for GitHub Actions `tests` check to pass
7. Review the diff and deployment-sensitive changes
8. Merge after checks and review complete
9. Render auto-deploys the resulting `main` commit

### GitHub Actions (`tests.yml`)
- Runs on pushes to `main` and pull requests
- PHP 8.4, Node.js 22, Composer setup
- Frontend checks, TypeScript checks, PHPUnit
- PHPStan suite available via `composer test` locally

---

## Additional Documentation

| Document | Path | Description |
|---|---|---|
| First Administrator | `docs/first-admin.md` | Safe administrator provisioning procedure |
| Storage Setup | `docs/storage.md` | Durable image storage and production guard |
| Email Configuration | `docs/email.md` | Mail setup, events, email boundaries |
| Queue Documentation | `docs/queue.md` | Database queue, email worker, retries, after-commit delivery |
| CI Workflow | `.github/workflows/tests.yml` | Pull-request and main-branch CI |
| Deployment Blueprint | `render.yaml` | Render service configuration |

---

## Contributing

1. **Do not develop directly on `main`**
2. Create a feature branch from `main`
3. Make changes and run all local checks
4. Push to GitHub and open a pull request
5. Wait for CI to pass
6. Review and merge

### Commit Message Format
```text
feat: <description>     # New feature
fix: <description>      # Bug fix
ops: <description>      # Operations/configuration change
```

---

## Support

For questions, issues, or documentation updates, open a pull request or contact the project maintainers.

---

*Danob Trading PLC — Built with Laravel, React, and Tailwind CSS*
