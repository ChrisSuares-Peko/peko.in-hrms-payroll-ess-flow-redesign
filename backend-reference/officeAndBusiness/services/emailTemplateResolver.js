'use strict';
const { customLog } = require('../utils/loggerHelper');
const { findPublishedTemplate } = require('../models/use-cases/emailTemplate');
const { findPublishedLayoutById } = require('../models/use-cases/emailLayout');
const { EMAIL_TEMPLATE_SERVICE } = require('../utils/emailTemplateKeys');
const { V2_ASSETS } = require('../utils/emailTemplates/sharedLayout');

// Shared resolver for admin-managed email templates. Each send site keeps its
// local template as the fallback source of truth; this only decides whether a
// published, active, fully-resolvable template exists to use instead.
//
// Never throws for an expected condition (missing/draft/inactive/malformed,
// store failure, timeout) — all resolve to the fallback, so a template problem
// never blocks an email. Every placeholder must have a non-empty value or the
// template is discarded rather than sent with a hole in it.

// Supported placeholder syntax: ${variable_name} — simple names only.
const PLACEHOLDER_PATTERN = /\$\{([^{}]*)\}/g;
const VARIABLE_NAME = /^[a-zA-Z0-9_]+$/;
// {{name}} (Handlebars-style) is never substituted — catch it rather than ship it as literal text.
const UNSUPPORTED_LEGACY_PLACEHOLDER = /\{\{[^{}]*\}\}/;

const has = (obj, name) => Object.prototype.hasOwnProperty.call(obj, name);

// Default From for a white-label partner's corporate: the partner's name on Peko's
// verified mailbox (same one utils/emailer.js defaults to). A row's own `sender` wins.
const DEFAULT_SENDER_MAILBOX = 'support@peko.one';
const brandedSender = (variables) => {
    const branding = String(variables?.branding || '').trim();
    return branding && branding !== 'Peko' ? `${branding} <${DEFAULT_SENDER_MAILBOX}>` : undefined;
};

const isFilled = (value) =>
    value !== undefined && value !== null && String(value).trim() !== '';

/**
 * Substitute ${name} placeholders. Controlled replacement only — no expression
 * evaluation, no property paths, no function calls.
 * @returns {{ ok: true, value: string } | { ok: false, reason: string }}
 */
const renderContent = (content, variables, label) => {
    if (typeof content !== 'string') {
        return { ok: false, reason: `${label} is missing` };
    }

    if (UNSUPPORTED_LEGACY_PLACEHOLDER.test(content)) {
        return { ok: false, reason: `${label} contains an unsupported {{...}} placeholder` };
    }

    // A body pasted from JS source can carry real `${...}` expressions whose braces
    // don't match PLACEHOLDER_PATTERN — reject anything that still opens one.
    if (content.replace(PLACEHOLDER_PATTERN, '').includes('${')) {
        return { ok: false, reason: `${label} contains an unsupported \${...} expression` };
    }

    let failure = null;
    const value = content.replace(PLACEHOLDER_PATTERN, (raw, token) => {
        const name = String(token).trim();
        if (!VARIABLE_NAME.test(name)) {
            failure = failure || `${label} contains unsupported placeholder "${raw}"`;
            return raw;
        }
        // hasOwnProperty, not `variables[name]` — otherwise ${constructor} and friends
        // would resolve off Object.prototype.
        if (!has(variables, name) || !isFilled(variables[name])) {
            failure = failure || `${label} placeholder "\${${name}}" has no value`;
            return raw;
        }
        return String(variables[name]);
    });

    return failure ? { ok: false, reason: failure } : { ok: true, value };
};

/**
 * Structural checks on the stored row. Returns a reason string when the template
 * cannot be used, or null when it passes.
 */
const rejectionReason = (template) => {
    if (!template) return 'not found';
    if (!template.key) return 'is malformed (missing key)';
    if (template.status !== 'PUBLISHED') return 'is not published';
    if (template.isActive !== true) return 'is inactive';
    if (!isFilled(template.publishedSubject)) return 'has no published subject';
    if (!isFilled(template.publishedHtmlBody)) return 'has no published HTML body';
    return null;
};

// Maps `layout` column keys to the ${headerHtml}/${footerHtml} slots templates use.
const LAYOUT_VARIABLE_BY_SLOT = { header: 'headerHtml', footer: 'footerHtml' };

/** Default values for placeholders a layout's own HTML might use; caller's values win. */
const layoutRenderVariables = (variables = {}) => ({
    currentYear: String(new Date().getFullYear()),
    supportEmail: V2_ASSETS.supportEmail,
    googlePlay: V2_ASSETS.googlePlay,
    googlePlayUrl: V2_ASSETS.googlePlayUrl,
    appStore: V2_ASSETS.appStore,
    appStoreUrl: V2_ASSETS.appStoreUrl,
    ...variables,
});

/**
 * Resolve a template's `layout` column into {headerHtml, footerHtml} overrides.
 * Never blocks or throws — any unusable layout is logged and skipped, leaving the
 * caller's own default in place (same fallback-first guarantee as above).
 */
const resolveLayoutOverrides = async (layout, { service, key, variables, logTraceId }) => {
    const overrides = {};
    if (!layout || typeof layout !== 'object') return overrides;

    for (const slot of Object.keys(LAYOUT_VARIABLE_BY_SLOT)) {
        const layoutId = layout[slot];
        if (!layoutId) continue;

        const variableName = LAYOUT_VARIABLE_BY_SLOT[slot];
        const logSkip = (reason) => customLog(logTraceId, 'info', {
            message: `Email layout override ${service}/${key} slot "${slot}" (layout #${layoutId}) ${reason}. Using default ${variableName}.`,
        });

        let row;
        try {
            row = await findPublishedLayoutById(layoutId);
        } catch (error) {
            logSkip(`could not be fetched (${error?.message})`);
            continue;
        }

        if (!row) {
            logSkip('was not found');
            continue;
        }
        if (row.status !== 'PUBLISHED') {
            logSkip('is not published');
            continue;
        }
        if (row.isActive !== true) {
            logSkip('is inactive');
            continue;
        }
        if (!isFilled(row.publishedHtml)) {
            logSkip('has no published HTML');
            continue;
        }

        const rendered = renderContent(
            row.publishedHtml,
            layoutRenderVariables(variables),
            `layout #${layoutId} HTML`
        );
        if (!rendered.ok) {
            logSkip(rendered.reason);
            continue;
        }

        overrides[variableName] = rendered.value;
    }

    return overrides;
};

/**
 * Resolve the subject and HTML for an email, preferring the admin-managed template.
 *
 * @param {object}   options
 * @param {string}   options.key             Template key, from EMAIL_TEMPLATE_KEYS.
 * @param {string}   [options.service]       Owning service; defaults to EMAIL_TEMPLATE_SERVICE.
 * @param {object}   [options.variables]     Values for the template's ${placeholders}.
 * @param {Function} options.fallback        Local template function returning the HTML body.
 * @param {string}   options.fallbackSubject Subject used with the local template.
 * @param {string}   [options.partnerId]     Prefers this partner's template over the shared default.
 * @param {string}   [options.logTraceId]
 * @returns {Promise<{subject: string, html: string, source: 'DYNAMIC'|'FALLBACK', reason?: string, sender?: string}>}
 */
exports.resolveEmailTemplate = async ({
    key,
    service = EMAIL_TEMPLATE_SERVICE,
    variables = {},
    fallback,
    fallbackSubject,
    partnerId = null,
    logTraceId = null,
}) => {
    // The fallback IS the contract — without it there is nothing to fall back to.
    if (typeof fallback !== 'function') {
        throw new Error('resolveEmailTemplate requires a fallback function');
    }

    const useFallback = (reason, level = 'info') => {
        customLog(logTraceId, level, {
            message: `Email template ${service}/${key} ${reason}. Using local fallback.`,
        });
        const sender = brandedSender(variables);
        return { subject: fallbackSubject, html: fallback(), source: 'FALLBACK', reason, ...(sender ? { sender } : {}) };
    };

    let template;
    try {
        template = await findPublishedTemplate({ service, key, partnerId });
    } catch (error) {
        // Store unreachable, slow or erroring — never a reason to skip the email.
        return useFallback(`could not be fetched (${error?.message})`, 'error');
    }

    const rejected = rejectionReason(template);
    if (rejected) return useFallback(rejected);

    // Merged last so a chosen layout replaces the caller's default headerHtml/footerHtml;
    // an unassigned or unresolvable slot leaves the caller's value untouched.
    const layoutOverrides = await resolveLayoutOverrides(template.layout, {
        service,
        key,
        variables,
        logTraceId,
    });
    const renderVariables = { ...variables, ...layoutOverrides };

    const subject = renderContent(template.publishedSubject, renderVariables, 'subject');
    if (!subject.ok) return useFallback(subject.reason);

    const html = renderContent(template.publishedHtmlBody, renderVariables, 'HTML body');
    if (!html.ok) return useFallback(html.reason);

    customLog(logTraceId, 'info', {
        message: `Email template ${service}/${key} loaded successfully.`,
    });
    // sender is not a placeholder: the row's own value, else the partner-branded
    // default; absent for Peko so the emailer keeps its current "from".
    const sender = template.sender || brandedSender(variables);
    return {
        subject: subject.value,
        html: html.value,
        source: 'DYNAMIC',
        ...(sender ? { sender } : {}),
    };
};
