# Deep demo data

Danob includes an opt-in `DemoDataSeeder` for local development, staging, screenshots, and acceptance testing.

It adds:

- three realistic package variants for each seeded product;
- deterministic demo quantities, thresholds, SKUs, and prices;
- six sample customer records;
- four sample supplier records.

All demo email addresses use the reserved `.test` domain and all demo records are labeled in notes where applicable.

## Run it locally or in staging

Set this only in a non-production environment:

```env
DANOB_SEED_DEMO_DATA=true
```

Then run:

```bash
php artisan db:seed
```

The seeder uses `updateOrCreate`, so it can be rerun safely in a disposable development or staging database.

## Production rule

Do not set `DANOB_SEED_DEMO_DATA=true` on Render or against the production Supabase database. Production records should come from real business operations, not sample data.
