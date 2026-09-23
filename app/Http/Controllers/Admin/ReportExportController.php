<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Reports\CustomerReport;
use App\Reports\InventoryMovementReport;
use App\Reports\LowStockReport;
use App\Reports\PurchaseReport;
use App\Reports\Report;
use App\Reports\ReturnReport;
use App\Reports\SalesReport;
use App\Reports\SupplierReport;
use App\Support\Exports\CsvExport;
use Generator;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Read-only CSV exports for the Phase 24 operational reports (Phase 25).
 *
 * Every export runs the SAME App\Reports\* classes as its web page —
 * identical validation rules, filters, aggregates, computed columns and
 * deterministic ordering — so one business definition feeds both
 * consumers and a filtered export contains exactly the rows the filtered
 * page shows (never the whole table, never only the visible page).
 *
 * Pagination is never applied here: the page paginates at 20 rows while
 * the export streams every matching row through lazy() chunking (eager
 * loads intact → no N+1, bounded memory → no full get()). Exports are
 * pure reads — 0 StockMovements, no writes — and the route groups enforce
 * the Phase 24 authorization matrix: staff may export sales, returns and
 * customers only; stock levels, thresholds, movement history, purchase
 * orders and supplier data stay admin/manager-only.
 *
 * XLSX and PDF are intentionally not present: no compatible export package
 * is installed in this project, and adding one was judged unnecessary risk
 * (CSV covers the operational need). See the Phase 25 notes.
 */
class ReportExportController extends Controller
{
    public function inventoryMovements(Request $request): StreamedResponse
    {
        return $this->csv($request, new InventoryMovementReport, 'inventory-movements');
    }

    public function purchases(Request $request): StreamedResponse
    {
        return $this->csv($request, new PurchaseReport, 'purchases');
    }

    public function sales(Request $request): StreamedResponse
    {
        return $this->csv($request, new SalesReport, 'sales');
    }

    public function returns(Request $request): StreamedResponse
    {
        return $this->csv($request, new ReturnReport, 'returns');
    }

    public function lowStock(Request $request): StreamedResponse
    {
        return $this->csv($request, new LowStockReport, 'low-stock');
    }

    public function suppliers(Request $request): StreamedResponse
    {
        return $this->csv($request, new SupplierReport, 'suppliers');
    }

    public function customers(Request $request): StreamedResponse
    {
        return $this->csv($request, new CustomerReport, 'customers');
    }

    /**
     * Validate exactly like the page, then stream every matching row under
     * those filters as a dated attachment: {slug}-{Y-m-d}.csv. The slug is
     * a fixed literal per report — user input never reaches the filename
     * (no traversal, no slashes, no extension control).
     */
    private function csv(Request $request, Report $report, string $slug): StreamedResponse
    {
        $validated = $request->validate($report->rules());
        $query = $report->rows($report->query($validated))
            ->with($report->exportEagerLoads());

        return CsvExport::download(
            $slug.'-'.now()->toDateString().'.csv',
            $report->columns(),
            (function () use ($report, $query): Generator {
                // lazy() walks the SAME ordered query in bounded chunks with
                // eager loads applied per chunk: every matching row, in the
                // report's fixed order, without paginate()'s 20-row cap and
                // without loading the dataset into memory.
                foreach ($query->lazy(500) as $model) {
                    foreach ($report->mapRows($report->transformRow($model)) as $cells) {
                        yield $cells;
                    }
                }
            })(),
        );
    }
}
