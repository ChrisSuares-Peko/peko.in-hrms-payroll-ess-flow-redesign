const { WHATSAPP_TEMPLATES } = require('../whatsAppTemplates/businessRegistration');

// SMS copy of each IndiaFilings WhatsApp template: same structure and the same
// positional {{n}} values, so one resolved template feeds both channels. Kept
// GSM-7 safe for the SMS gateway (dataCoding 0): no emoji and no *bold* markers,
// which would otherwise arrive as '?' or literal asterisks. {{button}} stands in
// for the WhatsApp URL button's own variable, and static buttons become plain links.
//
// Two deliberate departures from the WhatsApp wording: "reply to this message" is
// dropped (an SMS from a sender ID cannot be replied to), and the vendor's "you an
// reply" typo is not carried over.
//
// Indian SMS is DLT-scrubbed: operators only deliver text matching a template
// registered for the sender ID, so these bodies must be registered before they
// will reach customers in production.
const SMS_BODIES = Object.freeze({
    [WHATSAPP_TEMPLATES.SERVICE_STARTED]: [
        'Service Started',
        'Thank you for choosing us!',
        '',
        'Your following service has been started successfully.',
        '',
        'Service Name: {{1}}',
        'Business Name: {{2}}',
        '',
        'You can submit the required information, upload documents, and track your service status using the IndiaFilings app.',
        '',
        'https://indiafilings.com/app',
    ].join('\n'),

    [WHATSAPP_TEMPLATES.SERVICE_HOLD]: [
        'Service on Hold',
        '',
        '{{1}} service on hold. Please login to our platform to provide feedback.',
        '',
        'Agent: {{2}}',
        'Phone: {{3}}',
        '',
        'For assistance, contact the following persons.',
        '',
        'Manager: {{4}}, {{5}}',
    ].join('\n'),

    [WHATSAPP_TEMPLATES.SERVICE_INPROGRESS]: [
        'Service In Progress',
        '',
        'Your {{1}} service is currently in progress.',
        '',
        'Current Status: {{2}}',
        '',
        'You can log in to our platform to view the latest service status and provide any required information or documents.',
        '',
        'We will keep you updated as your service progresses.',
    ].join('\n'),

    [WHATSAPP_TEMPLATES.SERVICE_COMPLETED]: [
        'Service Complete - Request for Feedback',
        '',
        'The following service has been completed.',
        '',
        'Service Name: {{1}}',
        '',
        'Kindly provide feedback about your experience with {{2}} to help us improve our service by clicking on the link below.',
        '',
        'https://www.indiafilings.com/{{button}}',
    ].join('\n'),

    [WHATSAPP_TEMPLATES.SMART_FORM_STATUS]:
        'Status of {{1}} filing updated to {{2}}. Login to ledgers.cloud for more information.',

    [WHATSAPP_TEMPLATES.BUSINESS_ADVISOR_ASSIGNED]: [
        'Thank you for reaching out to IndiaFilings',
        '',
        'Our {{1}}, {{2}}, has been assigned to assist you with your {{3}} requirements.',
        '',
        'You may contact {{4}} directly at {{5}} for any assistance. You may also reach out to their Manager {{6}} at {{7}}.',
        '',
        'We look forward to working with you.',
        '',
        'Open App: https://indiafilings.com/app',
    ].join('\n'),
});

/**
 * Fill a template's SMS body with the same positional values sent to WhatsApp.
 *
 * @param {string}   template        a WHATSAPP_TEMPLATES key
 * @param {string[]} templateParams  values for {{1}}, {{2}}, ...
 * @param {object[]} [buttons]       WhatsApp button objects; the first one's text fills {{button}}
 * @returns {string|null} the SMS text, or null when the template has no SMS body
 */
const renderSmsText = (template, templateParams = [], buttons = []) => {
    const body = SMS_BODIES[template];
    if (!body) return null;

    const buttonText = buttons?.[0]?.parameters?.[0]?.text ?? '';
    // One pass with a function replacer: a value containing "{{2}}" or "$&" is
    // inserted literally rather than being re-expanded.
    return body.replace(/\{\{(\d+|button)\}\}/g, (_, key) =>
        key === 'button' ? String(buttonText) : String(templateParams[Number(key) - 1] ?? '')
    );
};

module.exports = { SMS_BODIES, renderSmsText };
