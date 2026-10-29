/* eslint-disable no-irregular-whitespace */
/* eslint-disable no-misleading-character-class */
// IndiaFilings sends us the FULLY RENDERED body of one of its approved WhatsApp
// templates. To replay it through our own campaign we have to work backwards:
// figure out which template produced the text, then pull each {{n}} value back
// out of it. Everything here is pure string work - no DB, no req.

const WHATSAPP_TEMPLATES = Object.freeze({
    SERVICE_STARTED: 'SERVICE_STARTED',
    SERVICE_HOLD: 'SERVICE_HOLD',
    SERVICE_INPROGRESS: 'SERVICE_INPROGRESS',
    SERVICE_COMPLETED: 'SERVICE_COMPLETED',
    SMART_FORM_STATUS: 'SMART_FORM_STATUS',
    BUSINESS_ADVISOR_ASSIGNED: 'BUSINESS_ADVISOR_ASSIGNED',
});

// AiSensy campaign wrapping each template. Sending is campaign-addressed, so
// these have to match the campaign names created in the AiSensy dashboard. The
// ones still to be created are left empty on purpose: an unset campaign makes
// the webhook report "not configured" instead of firing a call at a campaign
// that does not exist yet.
const WHATSAPP_CAMPAIGNS = Object.freeze({
    [WHATSAPP_TEMPLATES.SERVICE_STARTED]:  'India_Filings_Service_Started',
    [WHATSAPP_TEMPLATES.SERVICE_HOLD]:  'India_Filings_Service_Hold',
    [WHATSAPP_TEMPLATES.SERVICE_INPROGRESS]:  'India_Filings_Service_InProgress',
    [WHATSAPP_TEMPLATES.SERVICE_COMPLETED]:  'India_Filings_Service_Completed',
    [WHATSAPP_TEMPLATES.SMART_FORM_STATUS]: '',
    [WHATSAPP_TEMPLATES.BUSINESS_ADVISOR_ASSIGNED]:  '',
});

// Pictographs, dingbats, arrows/technical, variation selectors, keycaps and flags.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{1FB00}-\u{1FBFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{23FF}\u{FE00}-\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu;

// Canonicalise a rendered body so every template regex below can be written
// against plain text: no emoji, no *bold*, LF newlines, single blank lines.
// Order matters: CRLF before the per-line trim, emoji removal before the space
// collapse (it leaves orphan spaces behind).
const normalizeWhatsAppMessage = input => {
    if (input === null || input === undefined) return '';
    return String(input)
        .normalize('NFKC')
        .replace(/[﻿​-‍⁠‎‏]/g, '')
        .replace(/\r\n?/g, '\n')
        .replace(/[   -   　]/g, ' ')
        .replace(EMOJI_RE, '')
        // WhatsApp bold markers only - _ and ~ are legal in business names and
        // none of the six templates use them for formatting.
        .replace(/\*/g, '')
        .replace(/[^\S\n]+/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

// Every regex below assumes normalized input, runs with the `m` flag so ^/$ mean
// line bounds, and is deliberately case-SENSITIVE: the "Service on Hold" header
// and the "... service on hold." sentence differ only in case.

const SERVICE_COMPLETED_BODY = /^Service Name:\s*(.+)\n+[\s\S]*?experience with\s+(.+?)\s+to help us improve/m;

const SERVICE_INPROGRESS_BODY = /^Your (.+?) service is currently in progress\.\n+Current Status:\s*(.+)\n+Agent:\s*(.+)\n+Phone:\s*(.+)\n[\s\S]*?^Manager:\s*(.+)\n+Phone:\s*(.+)$/m;

// The Manager line here is "Manager: {{4}}, {{5}}" and must split on the LAST
// comma: the greedy (.+) plus the comma-free ([^,\n]+?) force it, so
// "Manager: Ravi Kumar, Jr., +919812300000" keeps "Ravi Kumar, Jr." as the name.
// A lazy left group would split on the first comma and be wrong.
const SERVICE_HOLD_BODY = /^(.+?) service on hold\. Please login to our platform to provide feedback\.\n+Agent:\s*(.+)\n+Phone:\s*(.+)\n[\s\S]*?^Manager:\s*(.+),\s*([^,\n]+?)\s*$/m;

// Business Name is optional/possibly empty - the controller falls back to the
// stored businessName rather than rejecting the whole message.
const SERVICE_STARTED_BODY = /^Service Name:\s*(.+)\n+(?:Business Name:\s*(.*)\n+)?Agent Name:\s*(.+)\n+Agent Mobile:\s*(.+)$/m;

// Opposite comma rule to SERVICE_HOLD: split on the FIRST comma. The role
// ("Business Advisor") never contains one, the name might, so ([^,\n]+) on the
// left is what keeps role and name from being swapped.
const ADVISOR_INTRO = /^Our ([^,\n]+), (.+?), has been assigned to assist you with your (.+?) requirements\.$/m;
const ADVISOR_CONTACT = /^You may contact (.+?) directly at (.+?) for any assistance\. You may also reach out to their Manager (.+?) at (.+?)\.$/m;

const SMART_FORM_STATUS_BODY = /^Status of\s+(.+?)\s+filing updated to\s+(.+?)\.\s*Login to ledgers\.cloud for more information\.?$/m;

// Ordered: the first `detect` that hits wins. Detection never keys off a label
// shared between templates ("Service Name:" is in T1 and T4; "Agent:"/"Phone:"/
// "Manager:" are in T2 and T3; the app URL is in T1 and T6) - only off a
// sentence unique to one template. SMART_FORM_STATUS is last because its detect
// is the loosest.
const TEMPLATE_MATCHERS = [
    {
        template: WHATSAPP_TEMPLATES.SERVICE_COMPLETED,
        detect: /^Service Complete\s*[-–—]\s*Request for Feedback$/m,
        extract: text => {
            const found = text.match(SERVICE_COMPLETED_BODY);
            if (!found) return null;
            return { serviceName: found[1], businessName: found[2] };
        },
    },
    {
        template: WHATSAPP_TEMPLATES.SERVICE_INPROGRESS,
        detect: / service is currently in progress\./,
        extract: text => {
            const found = text.match(SERVICE_INPROGRESS_BODY);
            if (!found) return null;
            // The two "Phone:" lines resolve positionally inside the one regex:
            // group 4 is anchored by the Agent line above it, group 6 by the
            // Manager line, and the lazy skip cannot jump past the first Manager.
            return {
                serviceName: found[1],
                currentStatus: found[2],
                agentName: found[3],
                agentPhone: found[4],
                managerName: found[5],
                managerPhone: found[6],
            };
        },
    },
    {
        template: WHATSAPP_TEMPLATES.SERVICE_HOLD,
        detect: / service on hold\. Please login to our platform/,
        extract: text => {
            const found = text.match(SERVICE_HOLD_BODY);
            if (!found) return null;
            return {
                serviceName: found[1],
                agentName: found[2],
                agentPhone: found[3],
                managerName: found[4],
                managerPhone: found[5],
            };
        },
    },
    {
        template: WHATSAPP_TEMPLATES.SERVICE_STARTED,
        detect: /has been started successfully\./,
        extract: text => {
            const found = text.match(SERVICE_STARTED_BODY);
            if (!found) return null;
            return {
                serviceName: found[1],
                businessName: found[2],
                agentName: found[3],
                agentMobile: found[4],
            };
        },
    },
    {
        template: WHATSAPP_TEMPLATES.BUSINESS_ADVISOR_ASSIGNED,
        detect: /^Thank you for reaching out to IndiaFilings$/m,
        extract: text => {
            const intro = text.match(ADVISOR_INTRO);
            const contact = text.match(ADVISOR_CONTACT);
            if (!intro || !contact) return null;
            // {{2}} and {{4}} are the same human but are two distinct Meta
            // variables, so both are kept.
            return {
                advisorRole: intro[1],
                advisorName: intro[2],
                serviceName: intro[3],
                contactName: contact[1],
                advisorPhone: contact[2],
                managerName: contact[3],
                managerPhone: contact[4],
            };
        },
    },
    {
        template: WHATSAPP_TEMPLATES.SMART_FORM_STATUS,
        detect: /^Status of .+ filing updated to /m,
        extract: text => {
            const found = text.match(SMART_FORM_STATUS_BODY);
            if (!found) return null;
            return { filingName: found[1], status: found[2] };
        },
    },
];

// IndiaFilings sends a `state` alongside the message. It only covers these three
// templates — Hold, Smart form status and Business advisor assigned have no state
// value and are still identified from the message body alone.
const STATE_TO_TEMPLATE = Object.freeze({
    started: WHATSAPP_TEMPLATES.SERVICE_STARTED,
    inprogress: WHATSAPP_TEMPLATES.SERVICE_INPROGRESS,
    completed: WHATSAPP_TEMPLATES.SERVICE_COMPLETED,
});

// Case and separators vary across vendors ("Inprogress", "In Progress", "IN_PROGRESS"),
// so compare on a stripped-down key rather than the raw string.
const templateForState = state => {
    if (!state) return null;
    return STATE_TO_TEMPLATE[String(state).toLowerCase().replace(/[\s_-]/g, '')] || null;
};

/**
 * @param {string} message rendered WhatsApp body as received from IndiaFilings
 * @param {string} [state] vendor state: Started | Inprogress | Completed
 * @returns {{ template, vars, normalized, selectedBy, messageTemplate }|null}
 *   - vars populated  -> template identified and every variable recovered
 *   - vars null       -> template identified but the vendor's wording drifted
 *   - null            -> no known template
 *   `selectedBy` is 'state' or 'message'; `messageTemplate` is what the body alone
 *   would have resolved to, so a caller can log a state/body disagreement.
 */
const matchWhatsAppTemplate = (message, state) => {
    const normalized = normalizeWhatsAppMessage(message);
    if (!normalized) return null;

    const detected = TEMPLATE_MATCHERS.find(matcher => matcher.detect.test(normalized)) || null;
    const stateTemplate = templateForState(state);

    // A recognised state is the more reliable signal and wins outright; the body
    // stays the only source of the {{n}} values either way. An unrecognised or
    // absent state falls back to identifying the template from the body.
    const chosen = stateTemplate
        ? TEMPLATE_MATCHERS.find(matcher => matcher.template === stateTemplate)
        : detected;
    if (!chosen) return null;

    return {
        template: chosen.template,
        vars: chosen.extract(normalized),
        normalized,
        selectedBy: stateTemplate ? 'state' : 'message',
        messageTemplate: detected ? detected.template : null,
    };
};

module.exports = {
    WHATSAPP_TEMPLATES,
    WHATSAPP_CAMPAIGNS,
    STATE_TO_TEMPLATE,
    normalizeWhatsAppMessage,
    templateForState,
    matchWhatsAppTemplate,
    TEMPLATE_MATCHERS,
};
