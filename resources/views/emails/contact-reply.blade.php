<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $contact->response_subject ?: ('Re: ' . $contact->subject) }}</title>
</head>
<body style="margin:0;padding:24px;background:#f7f1e8;color:#1d1a16;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid rgba(58,43,24,0.12);">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c2410c;font-weight:700;margin-bottom:12px;">
            AEUTNA
        </div>
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px 0;">Bonjour {{ $contact->name }},</h1>

        <div style="font-size:15px;line-height:1.7;white-space:pre-line;margin-bottom:24px;">
            {{ $responseMessage }}
        </div>

        <div style="padding:16px;border-radius:16px;background:#fff7eb;border:1px solid rgba(58,43,24,0.1);margin-bottom:24px;">
            <div style="font-size:12px;text-transform:uppercase;color:#6c757d;font-weight:700;margin-bottom:8px;">Message initial</div>
            <div style="font-size:14px;line-height:1.6;">
                <strong>Sujet :</strong> {{ $contact->subject }}<br>
                <strong>Message :</strong><br>
                <span style="white-space:pre-line;">{{ $contact->message }}</span>
            </div>
        </div>

        <div style="font-size:14px;color:#6c757d;">
            Ce message vous a été envoye par l administration AEUTNA.
        </div>
    </div>
</body>
</html>
