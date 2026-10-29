const { buildKybStatusEmail, getServiceUrl } = require('./kybStatusEmailTemplate');

const money = (value) =>
    Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const paragraph = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px">${text}</p>`;

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const bulletList = (items) =>
    `<ul style="Margin:0 0 16px 0;padding-left:20px;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px">${
        items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    }</ul>`;

const sectionLabel = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:22px;color:#111827;font-size:15px;font-weight:700;padding-bottom:8px">${text}</p>`;

const CELL = "font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;line-height:20px";

const dataTable = (headers, rows) => `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;width:100%;border:1px solid #E3E6EA;border-radius:8px;margin-bottom:20px">
        <tr>${headers.map((header, index) => `
            <td align="${index === 0 ? 'left' : 'right'}" bgcolor="#F9FAFB" style="${CELL};font-weight:700;color:#374151;background-color:#F9FAFB;padding:10px 16px;border-bottom:1px solid #E3E6EA">${escapeHtml(header)}</td>`).join('')}
        </tr>${rows.map((cells, rowIndex) => `
        <tr>${cells.map((cell, index) => `
            <td align="${index === 0 ? 'left' : 'right'}" style="${CELL};color:${index === 0 ? '#111827' : '#6B7280'};padding:10px 16px${rowIndex === rows.length - 1 ? '' : ';border-bottom:1px solid #EEF0F2'}">${escapeHtml(cell)}</td>`).join('')}
        </tr>`).join('')}
    </table>`;

const calloutBox = (text) => `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:20px">
        <tr>
            <td bgcolor="#FFFBEB" style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:14px 16px;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;line-height:22px;color:#92400E">${text}</td>
        </tr>
    </table>`;

const MAX_LISTED_PEOPLE = 10;

const pendingDuration = (since) => {
    const started = since ? new Date(since) : null;
    if (!started || Number.isNaN(started.getTime())) return '—';
    const hours = Math.floor((Date.now() - started.getTime()) / 3600000);
    if (hours < 1) return 'Less than an hour';
    if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
};

const normalisePerson = (person) =>
    (typeof person === 'string' ? { mobileNumber: person } : person || {});

exports.pendingKycNoticeTemplate = ({ companyName, hours, people }) => {
    const entries = (people || []).map(normalisePerson);
    const count = entries.length;
    const plural = count === 1 ? '' : 's';
    const listed = entries.slice(0, MAX_LISTED_PEOPLE);
    const hidden = count - listed.length;

    const paragraphHtml = [
        paragraph(`Dear ${escapeHtml(companyName || 'there')},`),
        paragraph(
            `${count} cardholder${plural} on your Corporate Cards account ${
                count === 1 ? 'has' : 'have'
            } not completed KYC in over ${escapeHtml(String(hours))} hours.`
        ),
        dataTable(
            ['Cardholder', 'Mobile', 'Pending for'],
            listed.map((person) => [
                person.name || 'Name not on file',
                person.mobileNumber || '—',
                pendingDuration(person.createdAt),
            ])
        ),
        hidden > 0
            ? paragraph(
                `<strong style="color:#111827">+ ${hidden} more cardholder${hidden === 1 ? '' : 's'}</strong> — open your dashboard for the full list.`
            )
            : '',
        calloutBox(
            `<strong>Their cards cannot be issued or used until KYC is complete.</strong> Any transaction attempted on a card without completed KYC will be declined.`
        ),
        sectionLabel('What to do next'),
        bulletList([
            'Ask each cardholder to open Corporate Cards and finish KYC from their dashboard.',
            'KYC takes a few minutes and needs their PAN and Aadhaar-linked mobile number.',
            'Remove anyone who no longer needs a card so they stop appearing in this reminder.',
        ]),
    ].join('');

    return buildKybStatusEmail({
        title: 'Pending KYC',
        iconGlyph: '&#33;',
        iconColor: '#D97706',
        iconBg: '#FFFBEB',
        headline: `KYC pending for ${count} cardholder${plural}`,
        preheader: `${count} cardholder${plural} cannot use their card until KYC is complete.`,
        paragraphHtml,
        buttonLabel: 'Review Cardholders',
    });
};

exports.walletBalanceReminderTemplate = ({ companyName, balance, asOf }) => {
    const low = Number(balance || 0) <= 0;
    const paragraphHtml = [
        paragraph(`Dear ${escapeHtml(companyName || 'there')},`),
        paragraph(`Here is your daily Corporate Cards wallet balance reminder for ${escapeHtml(asOf)}.`),
        paragraph(`<strong style="color:#111827">Available balance: INR ${escapeHtml(money(balance))}</strong>`),
        low
            ? calloutBox('<strong>Your wallet balance is exhausted.</strong> Card transactions will be declined until the wallet is topped up.')
            : paragraph('Keep your wallet funded so card transactions are never declined for insufficient balance.'),
    ].join('');

    return buildKybStatusEmail({
        title: 'Wallet Balance Reminder',
        iconGlyph: '&#8377;',
        iconColor: low ? '#D97706' : '#3AB75E',
        iconBg: low ? '#FFFBEB' : '#ECFDF3',
        headline: 'Your wallet balance today',
        preheader: `Corporate Cards wallet balance: INR ${money(balance)}`,
        paragraphHtml,
        buttonLabel: 'View Wallet',
        buttonHref: `${getServiceUrl()}/corporate-cards`,
    });
};

exports.weeklySpendDigestTemplate = ({ companyName, total, transactions, from, to }) => {
    const paragraphHtml = [
        paragraph(`Dear ${escapeHtml(companyName || 'there')},`),
        paragraph(`Here is your Corporate Cards spend for ${escapeHtml(from)} to ${escapeHtml(to)}.`),
        paragraph(
            `<strong style="color:#111827">Total spend: INR ${escapeHtml(money(total))}</strong> ` +
                `across ${transactions} authorised transaction${transactions === 1 ? '' : 's'}.`
        ),
        paragraph('Open your dashboard for the full breakdown by card and category.'),
    ].join('');

    return buildKybStatusEmail({
        title: 'Weekly Spend Digest',
        iconGlyph: '&#8377;',
        iconColor: '#3AB75E',
        iconBg: '#ECFDF3',
        headline: 'Your weekly spend digest',
        paragraphHtml,
        buttonLabel: 'View Dashboard',
    });
};
