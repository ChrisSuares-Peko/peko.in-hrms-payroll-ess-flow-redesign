const escapeHtml = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);

exports.vendorInvoiceEmail = ({ vendorName, invoiceNumber, documentTitle }) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>${escapeHtml(documentTitle || "Tax Invoice")} from Peko</title>
</head>
<body style="margin:0;padding:24px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:14px;line-height:1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
        <tr>
            <td>
                <p style="margin:0 0 16px;">Dear ${escapeHtml(vendorName || "Partner")},</p>
                <p style="margin:0 0 16px;">
                    Please find attached the ${escapeHtml(documentTitle || "Tax Invoice")}
                    ${escapeHtml(invoiceNumber || "")} raised by Peko on the commission for your services.
                </p>
                <p style="margin:0 0 16px;">
                    If anything on it needs correcting, reply to this email and our accounts team will put it right.
                </p>
                <p style="margin:0;">Regards,<br />Peko Accounts</p>
            </td>
        </tr>
    </table>
</body>
</html>`;
