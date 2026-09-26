# Queue & asynchronous processing (Phase 30)

Danob runs a **database-backed queue** (Laravel's `database` driver — no
Redis, no RabbitMQ, no custom broker) so transactional email never blocks a
web request. Everything needed to run it locally and in production is in
this document.

```text
business event (POST, inside DB transaction)
    → service registers after-commit callbacks
    → transaction commits
        → database notification  … written immediately (notification centre)
        → queued email job       … written to `jobs` table
    → worker (php artisan queue:work) picks the job up → SMTP → job deleted
                                        └ on failure: retry ×3 → failed_jobs
```

## Driver & configuration

| Variable | Value | Meaning |
| --- | --- | --- |
| `QUEUE_CONNECTION` | `database` (`.env.example`, `render.yaml`) | jobs live in PostgreSQL/SQLite `jobs` table |
| `DB_QUEUE_TABLE` | `jobs` (default) | queue table name |
| `DB_QUEUE` | `default` (default) | queue name |
| `DB_QUEUE_RETRY_AFTER` | `90` (default) | seconds before a stuck job is re-delivered |

The tables `jobs`, `job_batches` and `failed_jobs` come from the standard
Laravel migration (`0001_01_01_000002_create_jobs_table.php`) — they already
migrate with `php artisan migrate`, exactly like every application table.
`QUEUE_CONNECTION=sync` executes jobs inline instead of queueing; it is only
for throwaway scripts (the test suite uses it deliberately — see *Testing*).

## What is queued — and what never is

| Work | Transport | Why |
| --- | --- | --- |
| Customer emails (order created / confirmed / cancelled / delivered, return processed) | **queued** (`ShouldQueue` + `ShouldQueueAfterCommit`) | SMTP must not run inside the request |
| Internal alert emails (`inquiry_created`, `low_stock`, `out_of_stock`, PO received / partially received) — `AlertMailNotification` | **queued** (`ShouldQueue` + `ShouldQueueAfterCommit`) | same |
| In-app notifications (`AlertNotification`, database channel) | **synchronous, after commit** | the notification centre must be immediate and must never depend on a worker |

The internal alert is split into two classes on purpose: Laravel queues a
`ShouldQueue` notification **per channel**, so keeping `mail` on
`AlertNotification` would have pushed the database channel onto the queue
too and delayed the in-app centre. `AlertService` sends both after commit:
`AlertNotification` immediately, `AlertMailNotification` to the queue.

Nothing else is queued. There is no queued work triggered by GET requests,
React rendering, page refreshes or viewing a record — jobs are created only
by committed business events inside POST-driven services.

## The after-commit guarantee

A job must not exist until the business transaction has committed (and must
not exist at all if it rolls back). Two native mechanisms enforce this:

1. **Scheduling layer** — both email services register their notify calls
   with `DB::connection()->afterCommit(...)`, so nothing is even attempted
   while the transaction is open; a rollback discards the callback.
2. **Dispatch layer** — every queued notification implements
   `ShouldQueueAfterCommit`, so the framework itself defers the job push
   through Laravel's transaction manager. Even if a notification were
   dispatched directly inside a transaction, the job would still only become
   available at commit, and a rollback removes the pending dispatch.

`QueueProcessingTest` proves both directions with the *production*
transactions manager installed (the test double otherwise runs callbacks
immediately): inside an open transaction the `jobs` table is empty; after
the outermost commit the job appears; after a rollback neither job nor
notification ever exists.

## Retries, backoff and failed jobs

| Policy | Value | Declared on |
| --- | --- | --- |
| Total attempts | **3** | each email notification (`$tries`) |
| Backoff | **30 s, then 120 s** | each email notification (`$backoff`) |
| Worker defaults | `--tries=3 --backoff=30` | `render.yaml` worker command |

- After the 3rd failed attempt the job is moved to **`failed_jobs`** with
  the exception trace; the business data is untouched (email is a side
  effect only).
- Nothing is deleted from `failed_jobs` until the failure has been
  observed: inspect with `php artisan queue:failed`, re-dispatch with
  `php artisan queue:retry <id>`, discard all with `php artisan queue:flush`.
- Payloads contain the notification object and model **ids** only — the
  worker reloads the order/return from the database. No SMTP credentials,
  tokens or API keys are ever serialized into a job.

## Running the worker locally

```bash
# .env: QUEUE_CONNECTION=database, MAIL_MAILER=log (safe default)
php artisan queue:work
```

Without a running worker, jobs simply accumulate in `jobs` — the web app
keeps working normally; only email delivery is pending. Watch a specific
queue, run a single job, or inspect state:

```bash
php artisan queue:work --queue=default --once
php artisan queue:monitor jobs:100
php artisan queue:failed
```

## Production (Render)

`render.yaml` defines a second service next to the web tier:

```yaml
- type: worker
  name: danob-worker
  command: php artisan queue:work --tries=3 --backoff=30 --sleep=1 --max-time=3600
```

- Same repository, same Docker image; `docker/entrypoint.sh` detects the
  custom start command and skips the web bootstrap (no migrations, no
  caches — the web service owns those, so the worker never races a deploy).
- `--max-time=3600` makes the worker exit cleanly after an hour so Render
  restarts it with fresh code and memory; on SIGTERM (deploys, restarts) it
  finishes the current job first — no zombie processes.
- The worker's `envVars` mirror the web service (queue, database and mail
  must agree). Dashboard-only values (`DB_*`, `SUPABASE_*`, and once SMTP
  is enabled the `MAIL_HOST`/`MAIL_PORT`/`MAIL_USERNAME`/`MAIL_PASSWORD`/
  `MAIL_FROM_*` overrides) must also be set on the worker's dashboard
  Environment tab.
- **Note:** Render workers require a paid instance type. If `danob-worker`
  fails to provision on a free plan, the app still runs — emails queue but
  are not delivered until a worker exists.
- A deploy may start the worker before the web service has run migrations;
  the worker then restarts (Render backoff) until the `jobs` table exists.

## Testing

- `QueueProcessingTest` — queue-focused proofs: jobs are queued (not sent
  inline), become available only after commit, never appear on rollback,
  bounded retry policy, real `queue:work` execution with failure →
  `failed_jobs` → `queue:retry` success, no jobs from GET/Inertia loads,
  one job per business event across order/return/receiving/stock workflows.
- `TransactionalEmailTest` keeps the Phase 29 content assertions:
  `Notification::fake()` records queued sends too, so email content and
  recipient rules are asserted unchanged.
- `phpunit.xml` sets `QUEUE_CONNECTION=sync`: tests that care about *content*
  get instant inline execution, tests that care about *queueing* install
  `Queue::fake()` or switch to the `database` connection explicitly.
