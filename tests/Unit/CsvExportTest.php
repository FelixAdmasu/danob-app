<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\Exports\CsvExport;
use PHPUnit\Framework\TestCase;

/**
 * Direct tests for the CSV escaping and sanitisation rules the report
 * exports rely on (Phase 25): quote-only-when-needed, null cells, UTF-8
 * passthrough, and the formula-injection guard that must neutralise
 * =+-@ text WITHOUT corrupting ordinary negative numbers.
 */
class CsvExportTest extends TestCase
{
    public function test_values_are_quoted_only_when_required_and_quotes_are_doubled(): void
    {
        $row = CsvExport::encodeRow([
            'plain',
            'comma,cell',
            'quote"cell',
            "line\ncell",
            'cr'."\r".'cell',
        ]);

        $this->assertSame(
            "plain,\"comma,cell\",\"quote\"\"cell\",\"line\ncell\",\"cr\rcell\"\n",
            $row,
        );
    }

    public function test_null_becomes_an_empty_cell_and_scalars_stringify_deterministically(): void
    {
        $this->assertSame("a,,5,0,\n", CsvExport::encodeRow(['a', null, 5, 0, '']));
    }

    public function test_utf8_content_passes_through_unchanged(): void
    {
        $this->assertSame("Ünïcodé Value\n", CsvExport::encodeRow(['Ünïcodé Value']));
        $this->assertSame("\"Ünïcodé, mixed\"\n", CsvExport::encodeRow(['Ünïcodé, mixed']));
    }

    public function test_formula_like_text_is_prefixed_but_negative_numbers_are_not_corrupted(): void
    {
        // Values a spreadsheet would treat as formulas are neutralised with
        // the OWASP-style apostrophe prefix…
        $this->assertSame("'=SUM(A1:B2)\n", CsvExport::encodeRow(['=SUM(A1:B2)']));
        $this->assertSame("'+2+cmd\n", CsvExport::encodeRow(['+2+cmd']));
        $this->assertSame("'@command\n", CsvExport::encodeRow(['@command']));
        $this->assertSame("'-rm -rf\n", CsvExport::encodeRow(['-rm -rf']));
        $this->assertSame("'-\n", CsvExport::encodeRow(['-']));

        // …while ordinary numeric values — including negative money — stay
        // exactly as they are (never '-5.00).
        $this->assertSame("-5.00,-42,+42\n", CsvExport::encodeRow(['-5.00', '-42', '+42']));
        $this->assertSame("-1000\n", CsvExport::encodeRow([-1000]));
    }
}
