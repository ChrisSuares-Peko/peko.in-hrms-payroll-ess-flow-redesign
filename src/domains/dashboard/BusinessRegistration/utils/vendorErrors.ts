// Turns a raw filing-partner error (a terse code or message) into a short,
// actionable line the applicant can act on — enough context to find and fix the
// offending field, without leaking raw vendor codes. Used by every toast that
// surfaces a vendor failure (per-step sync + on-the-go document upload).

const RULES: Array<[RegExp, string]> = [
    // Infra/gateway failures (Cloudflare 5xx, origin timeouts) — never actionable;
    // keep the raw payload away from the user and tell them to retry.
    [
        /cloudflare|gateway\s*(time|error)|origin_gateway|origin\s*web\s*server|timed?\s*out|service unavailable|"status"\s*:\s*5\d\d/i,
        'We couldn’t reach the filing partner just now — please try again in a moment.',
    ],
    [
        /pan.*(invalid|mismatch|not\s*match|verif|fail)|invalid\s*pan|ERR011|ERR079/i,
        'The PAN could not be verified — please recheck the PAN number and the name exactly as on the PAN card.',
    ],
    [
        /postal|pincode|postal_code|ERR085/i,
        'The pincode was not accepted — please recheck the address pincode.',
    ],
    [/occupation/i, 'The occupation entered is not valid — please choose a valid occupation.'],
    [
        /qualification/i,
        'The qualification entered is not valid — please choose a valid qualification.',
    ],
    [/dob|date\s*of\s*birth|\bbirth\b/i, 'The date of birth looks invalid — please check it.'],
    [/e-?mail/i, 'An email address was rejected — please check the email entered.'],
    [
        /mobile|phone|contact\s*number/i,
        'A mobile number was rejected — please check the number entered.',
    ],
    [/din\b/i, 'A DIN was rejected — please check the director’s DIN.'],
    [
        /document|upload|\bfile\b|\bdocs?\b|classification|integration guide/i,
        'A document was not accepted — please make sure you’ve uploaded the correct, clear document (right type, readable, within the size limit) and try again.',
    ],
    [
        /gid|startup|application_id|subscription|PERMERR|NO_SUBS|no engagement|catalog service id|no application found|link this engagement|open_application/i,
        'We couldn’t reach the filing partner just now — please try again in a moment.',
    ],
];

const DEFAULT_FALLBACK =
    'Something in your details was not accepted by the filing partner. Please review the highlighted step and try again.';

// A person-named prefix ("Director John Doe — ...") is kept so the user knows
// WHOSE detail to fix; only the trailing code/message is mapped to friendly text.
const splitPrefix = (msg: string): [string, string] => {
    const idx = msg.indexOf('—');
    if (idx > 0 && idx < 60) return [`${msg.slice(0, idx + 1).trim()} `, msg.slice(idx + 1).trim()];
    return ['', msg];
};

// Strip a leading raw error code ("ERR003: ", "E0403 - ", "400: ") so the
// human-readable part surfaces without the cryptic prefix.
const stripCode = (msg: string): string =>
    msg.replace(/^\s*[A-Za-z]{0,5}\d{2,4}\s*[:\-–—]\s*/, '').trim();

const mapMessage = (msg: string, fallback: string): string => {
    const found = RULES.find(([re]) => re.test(msg));
    if (found) return found[1];
    // No specific rule — still surface the vendor's OWN message (minus any raw
    // code) so a NEW / unmapped error is never hidden behind a generic line.
    // The generic fallback is used only when there's no meaningful text left
    // (e.g. a bare error code) or the payload is a raw blob (JSON / oversized).
    const cleaned = stripCode(msg);
    if (/^[{[]/.test(cleaned) || cleaned.length > 160) return fallback;
    return cleaned.length > 4 ? cleaned : fallback;
};

// Name/PAN mismatch (ERR080): the vendor returns the actual name registered on
// the PAN — that's precisely what the user needs to correct, so surface it
// instead of a generic line.
const panNameMismatch = (msg: string): string | null => {
    if (!/name\s*mismatch|does not match the name|ERR080/i.test(msg)) return null;
    const onPan = msg.match(/name on the pan card\s*\(([^)]+)\)/i);
    return onPan
        ? `The name entered doesn’t match the PAN card — the PAN is registered as “${onPan[1].trim()}”. Please enter the name exactly as on the PAN.`
        : 'The name entered doesn’t match the name on the PAN card — please enter the name exactly as it appears on the PAN.';
};

// Uploaded-document OCR checks: the number or the name read from the document
// doesn't match the person's entered details (i.e. the wrong document was
// uploaded for this person). Surfaces the name on the document when given.
const documentMismatch = (msg: string): string | null => {
    const isMismatch =
        /\bOCR\b|does not match the provided|name\s*\([^)]+\)\s*does not match provided/i.test(msg);
    if (!isMismatch) return null;
    const nameOnDoc = msg.match(/name\s*\(([^)]+)\)\s*does not match provided/i);
    return nameOnDoc
        ? `The uploaded document doesn’t match this person — it appears to belong to “${nameOnDoc[1].trim()}”. Please upload the correct document for this person.`
        : 'The uploaded document’s details don’t match what was entered for this person — please upload the correct document.';
};

export const friendlyVendorError = (raw?: string, fallback: string = DEFAULT_FALLBACK): string => {
    const msg = String(raw ?? '').trim();
    if (!msg) return fallback;
    const [prefix, rest] = splitPrefix(msg);
    return prefix + (panNameMismatch(rest) ?? documentMismatch(rest) ?? mapMessage(rest, fallback));
};
