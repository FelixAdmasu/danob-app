{{--
  Phase 29 — customer-facing sales return email.

  Reports the authoritative return record: return number, order reference,
  returned quantities, return total and date. It deliberately makes no claim
  about money: a processed return is not automatically a refund, so no
  refund language, payment data or admin links appear here.
--}}
@extends('emails.layout')

@section('title', $heading)

@section('content')
    <span class="dnb-badge dnb-badge--{{ $statusTone }}">{{ $statusLabel }}</span>

    <h1 class="dnb-h1">{{ $heading }}</h1>

    <p class="dnb-p">Hello {{ $customerName }},</p>

    <p class="dnb-p">{{ $body }}</p>

    <p class="dnb-ref">
        <strong>Return {{ $returnNumber }}</strong>
        <span class="dnb-muted">&middot; order {{ $reference }}</span>
        @if ($returnDate)
            <span class="dnb-muted">&middot; {{ $returnDate }}</span>
        @endif
    </p>

    @if (! empty($rows))
        <table class="dnb-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="dnb-num">Returned qty</th>
                    <th class="dnb-num">Line total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        <td>{{ $row['name'] }}</td>
                        <td class="dnb-num">{{ $row['quantity'] }}</td>
                        <td class="dnb-num">{{ $row['line_total'] }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="dnb-total">
                    <td colspan="2" class="dnb-num">Return total</td>
                    <td class="dnb-num">{{ $total }}</td>
                </tr>
            </tfoot>
        </table>
    @endif

    <div class="dnb-note">{{ $nextStep }}</div>
@endsection

@section('footer', 'This is an automated return update from ' . (config('mail.from.name') ?: 'Danob') . '. Please do not reply to this message.')
