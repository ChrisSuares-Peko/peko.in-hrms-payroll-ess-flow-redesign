const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const businessRegistration = require('../../models/entities/businessRegistration');
const sms = require('../../utils/sms');
const { sendWhatsAppTemplate } = require('../../utils/whatsApp');
const {
    WHATSAPP_TEMPLATES,
    WHATSAPP_CAMPAIGNS,
    matchWhatsAppTemplate,
    templateForState,
} = require('../../utils/whatsAppTemplates/businessRegistration');
const { renderSmsText } = require('../../utils/smsTemplates/businessRegistration');
const { resolveServiceName } = require('../../utils/businessRegistrationVendorChain');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { customLog } = require('../../utils/loggerHelper');

// PUSH stays accepted so the vendor keeps getting a 200 instead of retrying, but
// browser push has been removed for now — the callback is acknowledged and dropped.
const NOTIFICATION_TYPES = ['SMS', 'PUSH', 'WHATSAPP'];
const EVENT_CACHE_PREFIX = 'india_filings_webhook_event_';
const EVENT_TTL_SECONDS = 24 * 60 * 60;

// UNDER_REVIEW -> "Under Review"
const humaniseStatus = status =>
    status
        ? String(status).toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : null;

// A callback with no message body is built from the DB row plus a couple of
// optional payload fields. Returns the same named vars the template switch reads
// from a parsed body, so nothing downstream needs to know which path produced them.
// Only the three state-addressable templates can arrive this way.
const buildVarsFromPayload = async (template, body, application) => {
    const serviceName = await resolveServiceName(application.entityType);

    switch (template) {
        case WHATSAPP_TEMPLATES.SERVICE_STARTED:
            return { serviceName, businessName: application.businessName };

        case WHATSAPP_TEMPLATES.SERVICE_INPROGRESS:
            return {
                serviceName,
                currentStatus: body.currentStatus || humaniseStatus(application.status),
            };

        case WHATSAPP_TEMPLATES.SERVICE_COMPLETED:
            return { serviceName, businessName: application.businessName };

        default:
            return null;
    }
};

// Works out which IndiaFilings template a callback is for and its positional {{n}}
// values. Shared by WhatsApp and SMS so both channels always carry the same content.
//   With a body: `state` picks the template when it is one of the three it covers,
//   otherwise the template is recovered from the body, and the values are extracted
//   from the body either way — payload fields are ignored.
//   Without a body: state picks the template (validated by the caller) and the
//   values come from the payload and the DB row.
// Returns { ok: true, template, templateParams, buttons, businessName } or
// { ok: false, error, detectedTemplate, selectedBy } — the caller decides whether a
// failure is fatal (WhatsApp) or has a fallback (SMS can forward the raw message).
const resolveTemplateParams = async ({ channel, message, hasMessage, state, body, application, traceId }) => {
    const label = channel === 'SMS' ? 'SMS' : 'WhatsApp';
    const match = hasMessage
        ? matchWhatsAppTemplate(message, state)
        : {
            template: templateForState(state),
            vars: await buildVarsFromPayload(templateForState(state), body, application),
            selectedBy: 'state',
            messageTemplate: null,
        };

    // State wins, but a disagreement means one of the two is wrong and is worth
    // seeing — extraction usually fails right after.
    if (match?.selectedBy === 'state' && match.messageTemplate && match.messageTemplate !== match.template) {
        customLog(traceId, 'error', {
            message: `${label} state disagrees with the message body`,
            state,
            stateTemplate: match.template,
            messageTemplate: match.messageTemplate,
            applicationId: application.applicationId,
        });
    }

    if (!match || !match.vars) {
        return {
            ok: false,
            detectedTemplate: match?.template || null,
            selectedBy: match?.selectedBy || null,
            error: new ErrorResponse(
                match?.template
                    ? `${label} message matched ${match.template} but its variables could not be extracted`
                    : `${label} message did not match any known template`,
                400
            ),
        };
    }

    const { template, vars } = match;
    const businessName = vars.businessName || application.businessName || '';
    let templateParams = [];
    let buttons = [];

    switch (template) {
        // Started and Inprogress carry no agent or manager: the body's Agent/Manager
        // lines are still what identifies an IndiaFilings message, but their values
        // are not forwarded.
        case WHATSAPP_TEMPLATES.SERVICE_STARTED:
            templateParams = [vars.serviceName, businessName];
            break;

        case WHATSAPP_TEMPLATES.SERVICE_HOLD:
            templateParams = [vars.serviceName, vars.agentName, vars.agentPhone, vars.managerName, vars.managerPhone];
            break;

        case WHATSAPP_TEMPLATES.SERVICE_INPROGRESS:
            templateParams = [vars.serviceName, vars.currentStatus];
            break;

        case WHATSAPP_TEMPLATES.SERVICE_COMPLETED: {
            // The button's variable is a separate Meta variable from the body's
            // {{1}} - it is the path suffix of https://www.indiafilings.com/{{1}}
            // and is not present in the rendered body, so it comes off the payload.
            const feedbackPath = body?.buttonUrlSuffix
                || body?.feedbackPath
                || application.vendorApplicationId
                || application.applicationId;
            templateParams = [vars.serviceName, businessName];
            buttons = [{
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: String(feedbackPath) }],
            }];
            break;
        }

        case WHATSAPP_TEMPLATES.SMART_FORM_STATUS:
            templateParams = [vars.filingName, vars.status];
            break;

        case WHATSAPP_TEMPLATES.BUSINESS_ADVISOR_ASSIGNED:
            // The [Open App] button is static, so it takes no parameters.
            templateParams = [
                vars.advisorRole,
                vars.advisorName,
                vars.serviceName,
                vars.contactName || vars.advisorName,
                vars.advisorPhone,
                vars.managerName,
                vars.managerPhone,
            ];
            break;

        default:
            return {
                ok: false,
                detectedTemplate: template,
                selectedBy: match.selectedBy,
                error: new ErrorResponse(`Unhandled ${label} template ${template}`, 400),
            };
    }

    // Meta rejects a template send with a blank variable, and a blank line in an
    // SMS reads just as badly.
    const missing = templateParams
        .map((value, index) => (value === undefined || value === null || String(value).trim() === '' ? index + 1 : null))
        .filter(Boolean);
    if (missing.length) {
        return {
            ok: false,
            detectedTemplate: template,
            selectedBy: match.selectedBy,
            error: new ErrorResponse(
                `${label} template ${template} is missing variable(s) {{${missing.join('}}, {{')}}}`,
                400
            ),
        };
    }

    customLog(traceId, 'info', {
        message: `${label} template resolved`,
        template,
        selectedBy: match.selectedBy,
        varsSource: hasMessage ? 'message' : 'payload',
        state,
        templateParams,
        buttons,
        applicationId: application.applicationId,
    });

    return { ok: true, template, templateParams, buttons, businessName };
};

// Payload: { notificationType: SMS | PUSH | WHATSAPP, engagementId, message?, eventId?, state? }
//   engagementId  IndiaFilings engagement id, matched against businessRegistrations.vendorEngagementId.
//   state   Started | Inprogress | Completed — when present, decides the template;
//           Hold / Smart form / Advisor have no state and are identified from the message.
//   message required for PUSH. For WHATSAPP and SMS it may be omitted when state is set,
//           in which case the template values come from the DB row, plus these optional
//           payload fields: currentStatus (Inprogress), buttonUrlSuffix (Completed).
//   WHATSAPP and SMS carry the same content: SMS is the WhatsApp template rendered as
//   plain text. An SMS message that matches no template is forwarded unchanged.
exports.handleStatusUpdate = asyncHandler(async (req, res, next) => {
    try {
        const { notificationType, engagementId, message, eventId, state } = req.body;

        customLog(req?.LogTraceId, 'info', {
            message: 'India filings webhook received',
            body: req.body,
        });

        const type = String(notificationType || '').toUpperCase();
        if (!NOTIFICATION_TYPES.includes(type)) {
            return next(new ErrorResponse(`notificationType must be one of ${NOTIFICATION_TYPES.join(', ')}`, 400));
        }
        if (!engagementId) {
            return next(new ErrorResponse('engagementId is required', 400));
        }
        const hasMessage = Boolean(message && String(message).trim());
        const isTemplated = type === 'WHATSAPP' || type === 'SMS';
        if (!isTemplated && !hasMessage) {
            return next(new ErrorResponse('engagementId and message are required', 400));
        }
        // Without a body the template can only be told apart by state, which covers
        // just three of the six templates.
        if (isTemplated && !hasMessage && !templateForState(state)) {
            return next(new ErrorResponse(
                `${type === 'SMS' ? 'SMS' : 'WhatsApp'} needs a message, or a state of Started, Inprogress or Completed`,
                400
            ));
        }

        if (eventId && (await getValue(`${EVENT_CACHE_PREFIX}${eventId}`))) {
            return res.status(200).json({
                status: true,
                message: 'Duplicate event ignored',
                responseCode: '000',
                data: {},
            });
        }

        const markProcessed = async () => {
            if (!eventId) return;
            try {
                await setValue(`${EVENT_CACHE_PREFIX}${eventId}`, EVENT_TTL_SECONDS, '1');
            } catch (cacheError) {
                customLog(req?.LogTraceId, 'error', {
                    message: 'Could not record webhook eventId',
                    eventId,
                    error: cacheError.message,
                });
            }
        };

        const application = await businessRegistration.findOne({
            where: { vendorEngagementId: String(engagementId) },
        });
        if (!application) {
            return next(new ErrorResponse('Application not found', 404));
        }

        switch (type) {
            case 'SMS': {
                if (!application.contactMobile) {
                    return next(new ErrorResponse('Application has no contact mobile', 422));
                }

                // Built from the same resolved template and values as the WhatsApp
                // message, rendered as plain SMS text.
                const resolved = await resolveTemplateParams({
                    channel: 'SMS',
                    message,
                    hasMessage,
                    state,
                    body: req.body,
                    application,
                    traceId: req?.LogTraceId,
                });
                const rendered = resolved.ok
                    ? renderSmsText(resolved.template, resolved.templateParams, resolved.buttons)
                    : null;

                // A body we cannot interpret — e.g. text already in a DLT SMS format —
                // is forwarded as-is, exactly as this webhook always did, rather than
                // dropping the customer's update.
                let smsText = rendered;
                if (!smsText) {
                    if (!hasMessage) {
                        return next(resolved.error || new ErrorResponse(`No SMS text for template ${resolved.template}`, 400));
                    }
                    customLog(req?.LogTraceId, 'info', {
                        message: 'SMS template not resolved; forwarding the raw message',
                        detectedTemplate: resolved.detectedTemplate || null,
                        reason: resolved.error?.message || null,
                        applicationId: application.applicationId,
                    });
                    smsText = message;
                }

                await sms.sendSMS(`+91${application.contactMobile}`, smsText);
                await markProcessed();
                return res.status(200).json({
                    status: true,
                    message: 'Notification sent',
                    responseCode: '000',
                    data: {
                        template: rendered ? resolved.template : null,
                        source: rendered ? 'template' : 'raw',
                        text: smsText,
                    },
                });
            }

            case 'PUSH':
                // Browser push is removed for now. Acknowledge with a 200 rather
                // than an error so the vendor does not retry the callback forever.
                await markProcessed();
                return res.status(200).json({
                    status: true,
                    message: 'Browser push notifications are disabled',
                    responseCode: '000',
                    data: {},
                });

            case 'WHATSAPP': {
                const resolved = await resolveTemplateParams({
                    channel: 'WHATSAPP',
                    message,
                    hasMessage,
                    state,
                    body: req.body,
                    application,
                    traceId: req?.LogTraceId,
                });
                if (!resolved.ok) {
                    customLog(req?.LogTraceId, 'error', {
                        message: 'WhatsApp template not resolved',
                        detectedTemplate: resolved.detectedTemplate,
                        selectedBy: resolved.selectedBy,
                        state,
                        applicationId: application.applicationId,
                        body: message,
                    });
                    return next(resolved.error);
                }
                const { template, templateParams, buttons, businessName } = resolved;

                if (!application.contactMobile) {
                    return next(new ErrorResponse('Application has no contact mobile', 422));
                }

                const whatsAppResult = await sendWhatsAppTemplate({
                    mobileNo: application.contactMobile,
                    campaignName: WHATSAPP_CAMPAIGNS[template],
                    templateParams,
                    buttons,
                    userName: application.contactPerson || businessName || undefined,
                    traceId: req?.LogTraceId,
                });

                // A send that failed at AiSensy is worth retrying, so leave the
                // event unmarked and answer 5xx. Anything skipped is our own
                // configuration (no API key, no campaign yet, non-production):
                // retrying cannot help, so answer 200 and say why.
                if (!whatsAppResult.sent && !whatsAppResult.skipped) {
                    return next(new ErrorResponse(
                        `WhatsApp send failed for ${template}: ${whatsAppResult.error}`,
                        502
                    ));
                }

                await markProcessed();
                return res.status(200).json({
                    status: true,
                    message: whatsAppResult.sent
                        ? 'WhatsApp notification sent'
                        : `WhatsApp notification not sent: ${whatsAppResult.reason}`,
                    responseCode: '000',
                    data: { template, templateParams, buttons, sent: whatsAppResult.sent },
                });
            }

            // Every channel above answers for itself; this only guards a type added to
            // NOTIFICATION_TYPES without a case, which would otherwise hang the request.
            default:
                return next(new ErrorResponse(`Unhandled notificationType ${type}`, 400));
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Error in india filings webhook',
            error: error.message,
        });
        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong.',
            responseCode: '001',
            data: {},
        });
    }
});
