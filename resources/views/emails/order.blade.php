{{--
  Phase 29 — customer-facing sales order email (created / confirmed /
  cancelled / delivered).

  Security boundary: this view receives authoritative order values only —
  reference, status, items, prices, totals. No admin URLs, no stock levels,
  no supplier or staff data may ever be passed in here.
--}}
@extends('emails.layout')

@section('title', $heading)

@section('content')
    <span class="dnb-badge dnb-badge--{{ $statusTone }}">{{ $statusLabel }}</span>

    <h1 class="dnb-h1">{{ $heading }}</h1>

    <p class="dnb-p">Hello {{ $customerName }},</p>

    <p class="dnb-p">{{ $body }}</p>

    <p class="dnb-ref">
        <strong>Order {{ $reference }}</strong>
        @if ($orderedAt)
            <span class="dnb-muted">&middot; placed {{ $orderedAt }}</span>
        @endif
    </p>

    @if (! empty($rows))
        <table class="dnb-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="dnb-num">Qty</th>
                    <th class="dnb-num">Unit price</th>
                    <th class="dnb-num">Line total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        <td>{{ $row['name'] }}</td>
                        <td class="dnb-num">{{ $row['quantity'] }}</td>
                        <td class="dnb-num">{{ $row['unit_price'] }}</td>
                        <td class="dnb-num">{{ $row['line_total'] }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="dnb-total">
                    <td colspan="3" class="dnb-num">Subtotal</td>
                    <td class="dnb-num">{{ $subtotal }}</td>
                </tr>
                <tr class="dnb-total">
                    <td colspan="3" class="dnb-num">Total</td>
                    <td class="dnb-num">{{ $total }}</td>
                </tr>
            </tfoot>
        </table>
    @endif

    <div class="dnb-note">{{ $nextStep }}</div>
@endsection

@section('footer', 'This is an automated order update from ' . (config('mail.from.name') ?: 'Danob') . '. Please do not reply to this message.')
