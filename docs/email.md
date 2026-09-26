# Email & transactional communication (Phase 29)

Danob sends two kinds of transactional email on top of — never instead of —
the database notification centre introduced in Phase 28.

```text
business event → existing service → database notification (in-app)
                                  → transactional email (side effect)
```

## Mail configuration

All configuration is standard Laravel, read from environment variables
(`config/mail.php`):

| Variable | Purpose | Safe default |
| --- | --- | --- |
| `MAIL_MAILER` | transport driver (`log`, `smtp`, `array`, …) | `log` |
| `MAIL_HOST` / `MAIL_PORT` | SMTP server | `127.0.0.1` / `2525` |
| `MAIL_SCHEME` | `ssl`/`tls` (optional) | unset |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials (never committed) | unset |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | global sender identity | `hello@example.com` / app name |
| `APP_URL` | base host for every link generated inside an email | `https://danob.onrender.com` in production |

No provider is hard-coded: any SMTP-compatible service works.

Links inside emails (the internal *Open in Danob* button, for example) are
built from named routes and `APP_URL` — never hard-coded — so production
links always point at `https://danob.onrender.com`. Localhost only ever
appears when running against a local `.env`.

### Local development

`.env.example` ships `MAIL_MAILER=log`, so running the app locally never
sends real email — every message is written to the Laravel log instead.
Switch to `MAIL_MAILER=smtp` only when you deliberately configure a server.

### Testing

`phpunit.xml` forces `MAIL_MAILER=array`, so the automated suite never opens
a network connection; the new tests additionally use `Notification::fake()`
for assertions. Test addresses always use the reserved `@example.test` /
`@example.com` domains.

### Production (Render)

`render.yaml` sets `MAIL_MAILER=log` as the safe default and stores **no**
mail secrets. To deliver real email, set on the Render dashboard
(Environment tab):

```text
MAIL_MAILER=smtp
MAIL_HOST=…
MAIL_PORT=…
MAIL_USERNAME=…
MAIL_PASSWORD=…        (dashboard only — never in the repository)
MAIL_SCHEME=ssl        (if required by the provider)
MAIL_FROM_ADDRESS=…    (a verified sender for your domain)
MAIL_FROM_NAME=Danob
```

## Which events send email

### Internal emails (role-based recipients, admin links allowed)

These travel on the **mail channel of the existing `AlertNotification`**,
gated by `AlertNotification::MAIL_TYPES`; recipients come from the unchanged
Phase 28 `AlertService` role families (`admin` / `manager` / `staff`).

| Event | Alert type | Recipients |
| --- | --- | --- |
| New website inquiry | `inquiry_created` | sales roles |
| Product quote request | `inquiry_created` (same event, with product/variant/quantity context) | sales roles |
| Low stock transition | `low_stock` | inventory roles |
| Out-of-stock transition | `out_of_stock` | inventory roles |
| PO partially received | `purchase_order_partially_received` | purchasing roles |
| PO fully received | `purchase_order_received` | purchasing roles |

Every other alert (order created/confirmed/cancelled/delivered, return
processed) stays **database-only**: those events reach the customer through
the emails below, so nobody receives the same event twice.

Inquiry → customer conversion intentionally sends **no** email: the existing
workflow has no notification requirement for it.

### Customer emails (`Customer.email`, when present and valid)

Sent by `TransactionalEmailService` as dedicated notification classes:

| Event | Notification |
| --- | --- |
| Sales order created (pending) | `OrderCreatedNotification` |
| Sales order confirmed | `OrderConfirmedNotification` |
| Sales order cancelled | `OrderCancelledNotification` |
| Sales order delivered | `OrderDeliveredNotification` |
| Sales return processed | `SalesReturnProcessedNotification` |

## Boundaries & safety rules

- **Customer vs internal.** Customer emails contain only the customer's own
  order/return data: reference, status, items, stored prices and totals.
  No admin URLs, stock levels, suppliers, staff or internal notes may ever
  appear in them. Internal emails may carry admin links because they only
  reach role-authorized users.
- **URLs** are always built with named `route()` calls on the server —
  never from request data.
- **Failure isolation.** Every send runs post-commit (`DB::afterCommit`),
  is wrapped in try/catch, and logs only the event name, record id and
  error message. A mail outage can never roll back an order, confirmation,
  cancellation, delivery, return, receiving or inquiry.
- **Skipped deliveries.** Customers without a (valid) email address are
  logged as a `transactional email skipped` info entry; the operation still
  succeeds.
- **Recipients without usable addresses** are skipped inside `via()`, so the
  mail channel is never attempted with an empty/malformed address.
- **Duplicate prevention.** Emails are triggered only by committed business
  events inside POST-driven services — never from React, page rendering,
  GET controllers, refreshes or viewing a record. A rolled-back attempt
  (e.g. reference-number retry) discards its deferred callback with the
  transaction.
- **No queue yet.** Nothing implements `ShouldQueue`; everything is
  synchronous and queue-ready. Queues, workers and Redis arrive in
  **Phase 30**.

## Templates

`resources/views/emails/`:

- `layout.blade.php` — shared Danob-branded, responsive shell (header,
  content slot, footer).
- `alert.blade.php` — internal alert (severity chip, message, detail rows,
  admin button).
- `order.blade.php` — customer order email (status chip, line-item table,
  totals, next step).
- `return.blade.php` — customer return email (returned quantities, return
  total, date).

The web UI is untouched: email styling is deliberately separate from the
approved application design.
