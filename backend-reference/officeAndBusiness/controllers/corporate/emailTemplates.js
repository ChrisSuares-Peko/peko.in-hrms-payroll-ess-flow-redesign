'use strict';
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { customLog } = require('../../utils/loggerHelper');

// Cross-service resolve for Mongo-backed services (e.g. payroll) that can't query
// adminEmailTemplates directly. Caller always supplies its own fallback, so this
// endpoint can never be the reason an email fails to send.
exports.resolveEmailTemplateForService = async (req, res) => {
    try {
        const { key, service, variables, fallbackSubject, fallbackHtml, partnerId } = req.body || {};

        if (!key || typeof key !== 'string') {
            return res.status(400).json({ status: false, message: 'key is required', data: {} });
        }
        if (!service || typeof service !== 'string') {
            return res.status(400).json({ status: false, message: 'service is required', data: {} });
        }
        if (typeof fallbackSubject !== 'string' || typeof fallbackHtml !== 'string') {
            return res.status(400).json({ status: false, message: 'fallbackSubject and fallbackHtml are required', data: {} });
        }

        const resolved = await resolveEmailTemplate({
            key,
            service,
            variables: (variables && typeof variables === 'object') ? variables : {},
            fallback: () => fallbackHtml,
            fallbackSubject,
            partnerId: typeof partnerId === 'string' && partnerId ? partnerId : null,
            logTraceId: req?.LogTraceId,
        });

        customLog(req?.LogTraceId, 'info', {
            message: 'Email template resolve requested by external service',
            data: { service, key, source: resolved.source },
        });

        return res.status(200).json({ status: true, message: 'Success', data: resolved });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Email template resolve endpoint failed',
            error: error?.message,
        });
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {} });
    }
};
