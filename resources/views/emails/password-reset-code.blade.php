<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Code de reinitialisation</title>
</head>
<body style="margin:0;padding:24px;background:#f7f1e8;color:#1d1a16;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid rgba(58,43,24,0.12);">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c2410c;font-weight:700;margin-bottom:12px;">
            AEUTNA
        </div>
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px 0;">Bonjour {{ $recipientName }},</h1>

        <p style="font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Nous avons recu une demande de reinitialisation de mot de passe pour votre compte.
            Utilisez le code ci-dessous pour continuer.
        </p>

        <div style="margin:24px 0;padding:18px 20px;border-radius:18px;background:#fff7eb;border:1px solid rgba(58,43,24,0.1);text-align:center;">
            <div style="font-size:12px;text-transform:uppercase;color:#6c757d;font-weight:700;margin-bottom:10px;letter-spacing:0.12em;">Code de verification</div>
            <div style="font-size:34px;font-weight:700;letter-spacing:0.35em;color:#1d1a16;">{{ $code }}</div>
        </div>

        <p style="font-size:14px;line-height:1.6;color:#6c757d;margin:0 0 12px 0;">
            Ce code expire dans 15 minutes. Si vous n etes pas a l origine de cette demande, vous pouvez ignorer cet email.
        </p>

        <div style="font-size:14px;color:#6c757d;">
            Message automatique envoye par AEUTNA.
        </div>
    </div>
</body>
</html>
