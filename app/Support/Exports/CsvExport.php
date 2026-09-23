<?php

declare(strict_types=1);

namespace App\Support\Exports;

use Generator;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Minimal streamed CSV writer for the read-only report exports (Phase 25).
 *
 * Memory safety: rows arrive as a generator (chunked lazy() queries on the
 * caller's side) and are written line-by-line straight to php://output, so
 * an export never materialises the whole dataset in memory — CSV stays the
 * large-data export on an 8GB development machine and in production.
 *
 * Format guarantees (unit-tested directly against encodeRow()):
 * - UTF-8 with BOM so spreadsheet software detects the encoding.
 * - Values are quoted only when required (comma, quote or line break) and
 *   embedded quotes are doubled, so commas/quotes/newlines inside text
 *   round-trip exactly.
 * - null becomes an empty cell; integers and 2dp money strings pass
 *   through untouched, including negative numerics.
 * - Spreadsheet formula-injection guard: a value beginning with =, +, - or
 *
 *   @ is prefixed with an apostrophe UNLESS it parses as a number, so
 *   "=SUM(A1)" can never execute while -5.00 stays a valid number.
 * - Column order is the report's declared columns() — fully deterministic.
 */
final class CsvExport
{
    /** UTF-8 byte-order mark. */
    private const BOM = "\xEF\xBB\xBF";

    /**
     * Stream a CSV attachment. $filename must already be safe (the export
     * controller builds it from a fixed slug plus the date, never from
     * user input).
     *
     * @param  list<string>  $headers
     * @param  iterable<array<int, mixed>>  $rows
     */
    public static function download(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows): void {
            $stream = fopen('php://output', 'w');

            fwrite($stream, self::BOM);
            self::writeRow($stream, $headers);

            foreach ($rows as $row) {
                self::writeRow($stream, $row);
            }

            fclose($stream);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Encode one CSV record (comma-joined cells, newline-terminated).
     * Public so the escaping and sanitisation rules are testable directly.
     *
     * @param  array<int, mixed>  $values
     */
    public static function encodeRow(array $values): string
    {
        $cells = [];

        foreach ($values as $value) {
            $cells[] = self::encodeValue($value);
        }

        return implode(',', $cells)."\n";
    }

    /**
     * @param  resource  $stream
     * @param  array<int, mixed>  $values
     */
    private static function writeRow($stream, array $values): void
    {
        fwrite($stream, self::encodeRow($values));
    }

    private static function encodeValue(mixed $value): string
    {
        $value = self::sanitize($value);

        // Quote only when the value would otherwise break the record:
        // it contains the delimiter, an enclosure or a line break.
        if (preg_match('/[",\r\n]/', $value) === 1) {
            return '"'.str_replace('"', '""', $value).'"';
        }

        return $value;
    }

    private static function sanitize(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        $value = (string) $value;

        // Formula-injection guard (OWASP-style apostrophe prefix), skipped
        // for numeric values so ordinary negative numbers are preserved.
        if ($value !== '' && str_contains('=+-@', $value[0]) && ! is_numeric($value)) {
            return "'".$value;
        }

        return $value;
    }
}
