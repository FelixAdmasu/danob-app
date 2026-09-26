{{--
  Phase 29 — the shared Danob transactional email shell.

  One layout every transactional email extends: brand header, content slot,
  footer. Plain HTML tables + a small inline stylesheet so it renders
  consistently and responsively in mail clients, matching the approved UI's
  calm, workmanlike tone without touching the web UI itself.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>@yield('title', config('mail.from.name') ?: 'Danob')</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100%; background-color: #f4f5f7; -webkit-font-smoothing: antialiased; }
        .dnb-pad { padding: 28px; }
        .dnb-h1 { margin: 10px 0 12px; font-family: Arial, Helvetica, sans-serif; font-size: 21px; line-height: 1.3; color: #111827; }
        .dnb-p { margin: 0 0 14px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #374151; }
        .dnb-muted { color: #6b7280; }
        .dnb-ref { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111827; }
        .dnb-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .dnb-badge--info { background: #dbeafe; color: #1d4ed8; }
        .dnb-badge--success { background: #dcfce7; color: #15803d; }
        .dnb-badge--warning { background: #fef3c7; color: #b45309; }
        .dnb-badge--critical { background: #fee2e2; color: #b91c1c; }
        .dnb-badge--muted { background: #f3f4f6; color: #374151; }
        .dnb-btn { display: inline-block; padding: 12px 22px; border-radius: 8px; background-color: #1f2937; color: #ffffff !important; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; }
        .dnb-table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; }
        .dnb-table th { padding: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .dnb-table td { padding: 10px 8px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; }
        .dnb-table .dnb-num { text-align: right; white-space: nowrap; }
        .dnb-total td { font-weight: 700; border-bottom: 0; border-top: 2px solid #111827; }
        .dnb-kv { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
        .dnb-kv td { padding: 7px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111827; vertical-align: top; border-bottom: 1px solid #f3f4f6; }
        .dnb-kv .dnb-kv-label { width: 38%; font-weight: 700; color: #374151; padding-right: 12px; }
        .dnb-note { margin: 18px 0 0; padding: 14px 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #374151; }
        .dnb-footer { font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6; color: #9ca3af; }
        @media only screen and (max-width: 620px) {
            .dnb-shell { width: 100% !important; }
            .dnb-pad { padding: 20px !important; }
            .dnb-table th, .dnb-table td { font-size: 12px; padding: 7px 5px; }
            .dnb-kv .dnb-kv-label { width: 42%; }
        }
    </style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0; background-color: #f4f5f7;">
    <tr>
        <td align="center" style="padding: 24px 10px;">
            <table role="presentation" class="dnb-shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <tr>
                    <td style="background-color: #111827; padding: 18px 28px;">
                        <span style="font-family: Arial, Helvetica, sans-serif; font-size: 19px; font-weight: 700; letter-spacing: 5px; color: #ffffff;">DANOB</span>
                        <span style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; letter-spacing: 1px; color: #9ca3af; padding-left: 8px;">Trading PLC</span>
                    </td>
                </tr>
                <tr>
                    <td class="dnb-pad">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 28px;">
                        <p class="dnb-footer" style="margin: 0;">
                            @hasSection('footer')
                                @yield('footer')
                            @else
                                This is an automated business notification from {{ config('mail.from.name') ?: 'Danob' }}. Please do not reply to this message.
                            @endif
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
