{{--
  Phase 29 — internal operational alert email (AlertNotification).

  Sent only to role-authorized internal recipients for the alert families in
  AlertNotification::MAIL_TYPES, so it may carry an admin link; context rows
  are plain values built server-side and escaped here.
--}}
@extends('emails.layout')

@section('title', $heading)

@section('content')
    <span class="dnb-badge dnb-badge--{{ $severity }}">{{ strtoupper($severity) }}</span>

    <h1 class="dnb-h1">{{ $heading }}</h1>

    <p class="dnb-p">{{ $body }}</p>

    @if (! empty($context))
        <table role="presentation" class="dnb-kv">
            @foreach ($context as $label => $value)
                <tr>
                    <td class="dnb-kv-label">{{ $label }}</td>
                    <td>
                        @if (is_array($value))
                            {!! nl2br(e(implode("\n", array_map('strval', $value)))) !!}
                        @else
                            {!! nl2br(e((string) $value)) !!}
                        @endif
                    </td>
                </tr>
            @endforeach
        </table>
    @endif

    @if ($actionUrl)
        <p style="margin: 22px 0 0;">
            <a class="dnb-btn" href="{{ $actionUrl }}">{{ $actionLabel }}</a>
        </p>
    @endif
@endsection

@section('footer', 'Internal Danob notification — sent to authorized staff. It may contain operational details and admin links.')
