<?php

declare(strict_types=1);

namespace App\Reports;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * ONE business definition per operational report, shared by the Phase 24
 * web report pages and the Phase 25 CSV exports. Filters, aggregates,
 * computed row columns, deterministic sort order and export columns each
 * exist exactly once here — there is no second export query layer, so a
 * filtered export always contains exactly what the filtered page shows.
 *
 * - rules()/query()/filters(): identical validation, database-side
 *   filtering and filter echo for the page and its export.
 * - summary(): the filter-aware aggregate (pages only; exports ship rows).
 * - rows(): eager loads + computed columns + fixed ordering — paginate(20)
 *   for the page, lazy() for the export (which never paginates).
 * - transformRow(): the single row normalisation both consumers share.
 * - columns()/mapRows(): the export's header and cell projection.
 *
 * Everything here is read-only: reports and exports create 0 StockMovements
 * and never touch quantities, statuses, returned_quantity, SalesReturns,
 * purchase orders, suppliers, customers or thresholds. No accounting policy
 * is invented — figures keep their operational labels (Delivered Sales
 * Value, Return Value, Purchase Value) exactly as the dashboards defined
 * them.
 */
abstract class Report
{
    /**
     * Validation rules — an export validates exactly what its page does.
     *
     * @return array<string, mixed>
     */
    abstract public function rules(): array;

    /**
     * Filtered base query: wheres only (no eager loads, no ordering).
     *
     * @param  array<string, mixed>  $validated
     */
    abstract public function query(array $validated): Builder;

    /**
     * Filter-aware summary normalised to the payload shape (ints and 2dp
     * decimal-string money), computed BEFORE rows() decorates the builder —
     * the same clone timing Phase 24 established.
     *
     * @return array<string, mixed>
     */
    abstract public function summary(Builder $query): array;

    /**
     * Row builder: eager loads, computed columns and the report's fixed
     * deterministic ordering (business timestamp DESC, id DESC — except
     * Low Stock, which keeps its Phase 20 quantity ordering).
     */
    abstract public function rows(Builder $query): Builder;

    /**
     * The filter values echoed to the page; the export link builder sends
     * the same payload, so exports always carry the applied filters.
     *
     * @return array<string, mixed>
     */
    abstract public function filters(array $validated): array;

    /**
     * Human-readable export header row, deterministic column order.
     *
     * @return list<string>
     */
    abstract public function columns(): array;

    /**
     * Export row(s) for one model, called AFTER transformRow(). Returns a
     * list so Returns explodes to one row per return line while every other
     * report stays one row per model.
     *
     * @return list<array<int, mixed>>
     */
    abstract public function mapRows(Model $model): array;

    /**
     * Display normalisation shared by the page and the export (identity
     * unless the report derives row-level figures).
     */
    public function transformRow(Model $model): Model
    {
        return $model;
    }

    /**
     * Extra eager loads ONLY the export consumes, so page payloads never
     * gain fields Phase 24 did not ship.
     *
     * @return array<string, mixed>
     */
    public function exportEagerLoads(): array
    {
        return [];
    }

    /**
     * Inclusive calendar-day range (date(col) >= from and date(col) <= to),
     * so from = to = X selects exactly that whole day regardless of any time
     * component. Only ever applied to a report's own timestamp column:
     * movements -> created_at, purchases -> ordered_at, sales -> ordered_at,
     * returns -> returned_at.
     */
    protected function applyDateRange(Builder $query, string $column, ?string $from, ?string $to): void
    {
        if ($from !== null && $from !== '') {
            $query->whereDate($column, '>=', $from);
        }

        if ($to !== null && $to !== '') {
            $query->whereDate($column, '<=', $to);
        }
    }
}
