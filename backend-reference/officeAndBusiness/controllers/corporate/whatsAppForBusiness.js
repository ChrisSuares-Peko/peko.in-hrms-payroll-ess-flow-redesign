/* eslint-disable no-unused-vars */
const axios = require('axios')
const jwt = require('jsonwebtoken')
const { createHmac } = require("crypto");
const asyncHandler = require("../../middlewares/async");
const { fetchServiceDetails, calculateAmountWithTax, calculateSurcharge } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const emailTemplates = require('../../utils/emailTemplates');
const emailer = require('../../utils/emailer')
const { createWhatsAppBusinessEntry, fetchWhatsAppBusinessByCredentialId, fetchOrdersByCredentialAndServiceOperator, fetchWhatsAppBusinessByEmail, findPackageByAccessCode, findAndCountAllUserSubscriptions, findActiveSubscriptionByCredentialId, findLastExpiredWhatsAppSubscription, findCurrentWhatsAppSubscription, findActiveBotBuilderByCredentialId, findLastExpiredBotBuilderSubscription, stopBotBuilderStatus, findActiveShopifyIntegrationByCredentialId, findLastExpiredShopifyIntegrationSubscription, stopShopifyIntegrationStatus, findOne, ensurePekoPlusWhatsAppBundle } = require('../../models/use-cases/whatsappBusiness');
const { createPaytmTransaction, createPGTransaction } = require('../../utils/pamentGatewayTransaction');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createNotification } = require('../../models/use-cases/notification');
const wallet = require('../../models/entities/wallet');
const {
    findOne: findOneServiceOperator
} = require('./../../models/use-cases/serviceOperator')
const { findWhatsappSubscriptions, updateWhatsappSubscriptionStatus } = require('../../models/use-cases/subscription');
const { createBusinessProfileApi, updateActivePlansApi, fetchAllProjectsApi, stopProjectsBillingApi, createProjectApi, stopBillingForProjectApi, reactivateProjectBillingApi, wccCreditUpdateApi, checkProjectExistApi, EmbeddedSignupURL } = require('../../services/whatsAppForBusiness');
const { fetchVendorDetailsByServiceDetails } = require('../../services/serviceDetails');
const { cancelWhatsAppSubscriptionMandate } = require('../../utils/cashfreeGateway');
const { resolveEmailForWabaUpdated, resolveWhatsappForBusiness, resolveEmailForBotActivated, resolveEmailForShopifyIntegrationActivated } = require('../../utils/emailTemplates/whatsappForBusiness');
const { partnerLogos } = require('../../utils/partnerLogos');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { resolvePaymentFailedEmail } = require('../../utils/emailTemplates/common');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { findOneOrder } = require('../../models/use-cases/order');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { computeJournalData } = require('../../utils/computeJournalData');
const { computeUpgradeCredit } = require('../../utils/upgradeCredit');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { customLog } = require('../../utils/loggerHelper');
const setting = require('../../models/entities/setting');
const WhatsAppSubscription = require('../../models/entities/whatsAppSubscription');
const WhatsAppBusiness = require('../../models/entities/whatsappBusiness');
const PackageEntity = require('../../models/entities/package');
const { PLAN_COMMISSION, removeCommissionFields } = require('../../utils/configuredFlag');
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup');


let accessKey = "REDACTED";
let packageAccessCode = 'whatsapp'

const createHash = async (text, secret) => {
    const hash = createHmac("sha256", secret).update(text).digest("hex");
    return hash;
};
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

exports.createBusinessProfile = asyncHandler(async (req, res, next) => {
    const { id: credentialId, corporateId: corporateUserId } = req.user;
    customLog(req?.LogTraceId, 'info', {
        message: '[WA-BUNDLE] createBusinessProfile: entry',
        credentialId,
        corporateUserId,
        reqUser: req.user,
    });
    const vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey);

    // Step #1: Check if already created or not
    const { status, message, businessId, projectId } = await fetchWhatsAppBusinessByCredentialId(credentialId);
    customLog(req?.LogTraceId, 'info', {
        message: '[WA-BUNDLE] createBusinessProfile: fetchWhatsAppBusinessByCredentialId result',
        credentialId,
        status,
        businessId,
        projectId,
    });

    // Peko+ bundle: when WhatsAppBusiness has no projectId yet, surface the bundled
    // whatsAppSubscriptions.projectId (initially 'PENDING') so the frontend gates
    // isPurchased=true and mounts LandingPage, which mints the real AiSensy project
    // via /whatsapp-bundle/init.
    let resolvedProjectId = projectId;

    // Also fetch ALL rows for this corporate (no filters) so we can see actual state
    // of any whatsAppSubscriptions data — helps diagnose why the trio filter misses.
    const allRowsForCorp = corporateUserId ? await WhatsAppSubscription.findAll({
        where: { corporateUserId },
        attributes: ['id', 'projectId', 'status', 'billingPlan', 'isCustom', 'isCancelled', 'subscriptionPaymentRefId', 'subscriptionPrice', 'subscriptionStartDate', 'subscriptionEndDate', 'createdAt'],
        raw: true,
    }) : [];
    customLog(req?.LogTraceId, 'info', {
        message: '[WA-BUNDLE] createBusinessProfile: ALL whatsAppSubscriptions rows for corporate',
        corporateUserId,
        rowCount: allRowsForCorp.length,
        rows: allRowsForCorp,
    });

    if (!resolvedProjectId && corporateUserId) {
        const bundled = await WhatsAppSubscription.findOne({
            where: {
                corporateUserId,
                status: 'ACTIVE',
                isCancelled: false,
                subscriptionPaymentRefId: null,
                billingPlan: 'BASIC',
                isCustom: false,
            },
            attributes: ['id', 'projectId', 'status', 'billingPlan', 'isCustom', 'isCancelled', 'subscriptionPaymentRefId'],
            raw: true,
        });
        customLog(req?.LogTraceId, 'info', {
            message: '[WA-BUNDLE] createBusinessProfile: bundle trio lookup',
            corporateUserId,
            credentialId,
            whatsAppBusinessProjectId: projectId,
            bundled,
            matched: !!bundled,
        });
        if (bundled?.projectId) resolvedProjectId = bundled.projectId;
    }

    // Step #2: Resolve businessId — create the AiSensy business profile if we don't already
    // have one locally. We do this BEFORE the bundle/project materialization so a single
    // dashboard mount on a Peko+ account ends with both a real businessId and a real projectId.
    let finalBusinessId = businessId;
    let createdBusinessData = null;
    let createdEntryData = null;
    let wasCreated = false;
    if (!status || !businessId) {
        customLog(req?.LogTraceId, 'info', {
            message: '[WA-BUNDLE] createBusinessProfile: taking CREATE branch (no WhatsAppBusiness row yet)',
            credentialId,
            corporateUserId,
            resolvedProjectId,
        });
        const { status: status2, message: message2, data: businessData } = await createBusinessProfileApi(req, vendor);
        if (!status2) return next(new ErrorResponse(message2, 400));

        const { status: status3, message: message3, data: createdEntry } = await createWhatsAppBusinessEntry({
            businessId: businessData.business_id,
            credentialId: credentialId,
        });
        if (!status3) return next(new ErrorResponse(message3, 400));

        finalBusinessId = businessData.business_id;
        createdBusinessData = businessData;
        createdEntryData = createdEntry;
        wasCreated = true;
    }

    // Step #3: Self-heal backfill — TEMP DISABLED (Peko+ → WhatsApp Basic bundling temporarily off).
    // This block used to create a free bundled WhatsApp BASIC row inline for Peko+ customers who had
    // no WhatsApp row yet. While bundling is disabled we must NOT backfill new bundles, otherwise a
    // never-bundled Peko+ user would silently get one on first WhatsApp dashboard visit. Existing
    // bundles are unaffected (they already short-circuit resolvedProjectId at the trio lookup above).
    // To re-enable, uncomment the ensurePekoPlusWhatsAppBundle block below.
    // if (!resolvedProjectId && corporateUserId) {
    //     try {
    //         const ensured = await ensurePekoPlusWhatsAppBundle({ corporateUserId, credentialId });
    //         customLog(req?.LogTraceId, 'info', {
    //             message: '[WA-BUNDLE] createBusinessProfile: ensurePekoPlusWhatsAppBundle result',
    //             corporateUserId,
    //             credentialId,
    //             ensuredId: ensured?.id ?? null,
    //             ensuredProjectId: ensured?.projectId ?? null,
    //         });
    //         if (ensured?.projectId) resolvedProjectId = ensured.projectId;
    //     } catch (ensureErr) {
    //         customLog(req?.LogTraceId, 'error', {
    //             message: '[WA-BUNDLE] createBusinessProfile: ensurePekoPlusWhatsAppBundle threw — letting frontend show "Subscribe Now" rather than failing the request',
    //             corporateUserId,
    //             credentialId,
    //             error: ensureErr?.message ?? ensureErr,
    //         });
    //     }
    // }

    // Step #4: Materialize the AiSensy project for the bundle row, if needed.
    //
    // Two cases (both result in a real projectId on first mount, no PENDING flicker):
    //   A. Bundle row needs a project AND whatsAppBusiness already has a real prior projectId
    //      → reactivate that existing AiSensy project with the bundle's plan. Happens when a
    //      user had WhatsApp before (Pro/Basic) that expired/cancelled, then bought Peko+.
    //      Mirrors the WhatsApp CHARGE webhook reactivate pattern at cashFreeGateway.js:2496.
    //   B. Bundle row needs a project AND no prior real projectId exists
    //      → create a fresh AiSensy project via createProjectApi and link both rows to it.
    //      Happens when Peko+ is the user's first WhatsApp purchase.
    //
    // Failures here are non-fatal: leave bundle at PENDING; the LandingPage's
    // /whatsapp-bundle/init call will retry on mount.
    if (finalBusinessId && corporateUserId) {
        try {
            const bundle = await WhatsAppSubscription.findOne({
                where: {
                    corporateUserId,
                    status: 'ACTIVE',
                    isCancelled: false,
                    subscriptionPaymentRefId: null,
                    billingPlan: 'BASIC',
                    isCustom: false,
                },
                raw: true,
            });
            const needsMaterialization = bundle && (!bundle.projectId || bundle.projectId === 'PENDING');
            if (needsMaterialization) {
                // Re-fetch whatsAppBusiness so we see the latest projectId (in case CREATE branch
                // just persisted it). If it carries a real id from a prior WhatsApp purchase, we
                // reactivate instead of minting a duplicate project on AiSensy.
                const wab = await WhatsAppBusiness.findOne({
                    where: { businessId: finalBusinessId },
                    attributes: ['projectId'],
                    raw: true,
                });
                const existingRealProjectId =
                    wab?.projectId && wab.projectId !== 'PENDING' ? wab.projectId : null;

                if (existingRealProjectId) {
                    // CASE A: Reactivate the prior AiSensy project with the bundle's plan.
                    // Plan format `${billingPlan}_${billingTypeFmt}` matches the WhatsApp CHARGE
                    // webhook reactivate call (see cashFreeGateway.js:2494-2500).
                    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL, optional4: familyId } = vendor;
                    const billingTypeFmt = bundle.billingType === 'ANNUALLY' ? 'YEARLY' : bundle.billingType;
                    const defaultPlan = `${bundle.billingPlan}_${billingTypeFmt}`;
                    await axios.patch(
                        `${URL}/partner/${PartnerId}/project/${existingRealProjectId}/billing/reactivate-project`,
                        { familyId: `${familyId}`, defaultPlan },
                        { headers: { 'Content-Type': 'application/json', 'X-AiSensy-Partner-API-Key': `${API_Key}` } },
                    );
                    await WhatsAppSubscription.update(
                        { projectId: existingRealProjectId },
                        { where: { id: bundle.id } },
                    );
                    resolvedProjectId = existingRealProjectId;
                    customLog(req?.LogTraceId, 'info', {
                        message: '[WA-BUNDLE] createBusinessProfile: reactivated prior AiSensy project for new Peko+ bundle',
                        corporateUserId,
                        credentialId,
                        projectId: existingRealProjectId,
                        defaultPlan,
                    });
                } else {
                    // CASE B: Create a fresh AiSensy project for this bundle.
                    const pkg = await PackageEntity.findByPk(bundle.packageId, { attributes: ['packageName'], raw: true });
                    const projectName = `${process.env.NODE_ENV === 'production' ? 'P' : 'U'}_${credentialId}_${req.user?.username ?? ''}`;
                    const subForApi = {
                        billingType: bundle.billingType,
                        package: { packageName: pkg?.packageName },
                    };
                    const projectResult = await createProjectApi(vendor, subForApi, finalBusinessId, {
                        body: { name: projectName },
                        user: req.user,
                    });
                    customLog(req?.LogTraceId, 'info', {
                        message: '[WA-BUNDLE] createBusinessProfile: createProjectApi result',
                        corporateUserId,
                        credentialId,
                        status: projectResult?.status,
                        realProjectId: projectResult?.data?.id ?? null,
                    }, projectResult?.status ? undefined : 'VENDOR');
                    if (projectResult?.status && projectResult?.data?.id) {
                        await WhatsAppSubscription.update(
                            { projectId: projectResult.data.id },
                            { where: { id: bundle.id } },
                        );
                        await WhatsAppBusiness.update(
                            { projectId: projectResult.data.id },
                            { where: { businessId: finalBusinessId } },
                        );
                        resolvedProjectId = projectResult.data.id;
                    }
                }
            }
        } catch (projErr) {
            customLog(req?.LogTraceId, 'error', {
                message: '[WA-BUNDLE] createBusinessProfile: AiSensy project materialization failed — leaving bundle at PENDING for LandingPage init retry',
                corporateUserId,
                credentialId,
                error: projErr?.message ?? projErr,
            }, 'VENDOR');
        }
    }

    // Step #5: Single response — preserve the original CREATE / EXISTING response shapes so
    // existing frontend code keying off responseCode '000' vs '001' continues to work.
    if (wasCreated) {
        const responsePayload = { ...createdBusinessData, ...createdEntryData, projectId: resolvedProjectId };
        customLog(req?.LogTraceId, 'info', {
            message: '[WA-BUNDLE] createBusinessProfile: CREATE branch response',
            credentialId,
            corporateUserId,
            responseProjectId: resolvedProjectId,
            responsePayloadKeys: Object.keys(responsePayload),
        });
        return res.status(200).json({
            status: true,
            message: "Business profile created successfully",
            responseCode: '000',
            data: responsePayload,
        });
    }
    customLog(req?.LogTraceId, 'info', {
        message: '[WA-BUNDLE] createBusinessProfile: EXISTING branch response',
        credentialId,
        corporateUserId,
        businessId: finalBusinessId,
        originalProjectId: projectId,
        resolvedProjectId,
    });
    return res.status(200).json({
        status: true,
        message: "Business profile already exists",
        responseCode: '001',
        data: { businessId: finalBusinessId, projectId: resolvedProjectId },
    });
});

exports.stopWhatsAppBilling = asyncHandler(async (req, res, next) => {
    const { id: credentialId, corporateId: corporateUserId } = req.user;

    let vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey)

    const subscription = await findWhatsappSubscriptions(corporateUserId, accessKey);
    if (!subscription || !subscription?.id) return next(new ErrorResponse("Subscription not found.", 404));


    const { status, message, businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);
    if (!status) return next(new ErrorResponse(message, 402));

    const { status: status2, message: manage2, data: projectData } = await fetchAllProjectsApi(vendor, businessId)
    if (!status2) return next(new ErrorResponse(manage2, 402));
    if (Array.isArray(projectData) && projectData?.length === 0) {
        return next(new ErrorResponse(manage2, 400));
    }

    const { status: status3, message: message3, data: stoppedResult } = await stopProjectsBillingApi(vendor, projectData)
    if (!status3) return next(new ErrorResponse(message3, 400));

    // check all result for finding if any one faild
    const hasErrors = stoppedResult.some(result => !result.success);
    if (hasErrors) {
        return res.status(500).json({
            status: false,
            responseCode: '001',
            message: "One or more operations failed.",
            data: stoppedResult
        });
    }
    // All project billings stopped successfully

    let isUpdated;
    customLog(req?.LogTraceId, "info", { subscription })
    if (subscription?.package?.accessCode === packageAccessCode) {
        isUpdated = await updateWhatsappSubscriptionStatus(subscription?.id, corporateUserId);
    } else {
        isUpdated = false
    }
    if (isUpdated) {
        return res.status(200).json({
            status: true,
            message: 'WhatsApp business billing stopped successfully',
            data: stoppedResult,
            responseCode: '000',
        });
    } else {
        return res.status(400).json({
            status: false,
            message: 'WhatsApp business billing stopped, Subscription faild to stop',
            data: stoppedResult,
            responseCode: '001',
        });
    }
});

exports.fetchAllProjects = asyncHandler(async (req, res, next) => {
    const { id: credentialId } = req.user;
    let vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey)

    const { status, message, businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);
    if (!status) {
        return next(new ErrorResponse("Business Profile Not exits", 402));
    }

    const { status: status2, message: manage2, data: projectData } = await fetchAllProjectsApi(vendor, businessId)
    if (!status2) return next(new ErrorResponse(manage2, 402));

    return res.status(200).json({
        status: true,
        message: "Projects fetched successfully!!",
        responseCode: '000',
        data: projectData
    });
});

exports.checkProjectExist = asyncHandler(async (req, res, next) => {
    const { id: credentialId } = req.user;
    const { name } = req.body
    let vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey)

    const { status, message, businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);
    if (!status) {
        return next(new ErrorResponse("Business Profile Not exits", 402));
    }

    const { status: status2, message: manage2 } = await checkProjectExistApi(vendor, businessId, name)
    // if (!status2) return  next(new ErrorResponse(manage2, 402));
    if (!status2) {
        return res.status(400).json({
            status: false,
            message: manage2,
            responseCode: '001',
            data: {}
        });
    }

    return res.status(200).json({
        status: true,
        message: "Project not exist with the provided name",
        responseCode: '000',
        data: {}
    });
});

exports.createProject = asyncHandler(async (req, res, next) => {
    const { id: credentialId, corporateId: corporateUserId } = req.user;
    let vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey)

    const { status, message, businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);
    if (!status) return next(new ErrorResponse("WhatsApp business data not found", 404));

    const subscription = await findWhatsappSubscriptions(corporateUserId, accessKey)
    if (!subscription) return next(new ErrorResponse("Subscription not found.", 404));

    const { status: status2, message: message2, data: createdProject } = await createProjectApi(vendor, subscription, businessId, req)
    if (!status2) return next(new ErrorResponse(message2, 500));

    return res.status(200).json({
        status: true,
        message: "Project Created successfully!!",
        responseCode: '000',
        data: createdProject
    });
});

exports.generateEmbeddedSignupURL = asyncHandler(async (req, res, next) => {
    const { id: credentialId } = req.user;
    const { id } = req.body
    const vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey);

    // Step #1: To fetch the businessId
    const { status, message, businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);

    if (status, businessId) {
        const { status: status2, message: message2, data } = await EmbeddedSignupURL(req, vendor, businessId, id);
        if (!status2) return next(new ErrorResponse(message2, 400));
        return res.status(200).json({
            status: true,
            message: "Embedded signup URL generated successfully",
            responseCode: '000',
            data
        });
    }
})

exports.stopProjectBilling = asyncHandler(async (req, res, next) => {
    const { id } = req.body

    // The cancel button sends the subscription PK (NOT the AiSensy projectId). Resolve the row by PK,
    // scoped to the requesting user, so we can (a) stop AiSensy billing using its REAL projectId and
    // (b) cancel exactly that row. Passing the PK straight to AiSensy as a projectId — and then querying
    // `projectId: <PK>` — was the bug that made every production cancel fail. Bail explicitly if nothing
    // matches — never report success for a row we didn't actually cancel.
    const mainSub = await WhatsAppSubscription.findOne({
        where: { id, credentialId: req.user.id, status: 'ACTIVE', isCustom: false },
        attributes: ['id', 'projectId', 'vendorSubscriptionId'],
        raw: true,
    });
    if (!mainSub) return next(new ErrorResponse('No active subscription found to cancel.', 404));

    // Stop AiSensy project billing using the REAL projectId — best-effort. We skip the vendor call when:
    //  - in staging (no real WABA project; the call always errors there), or
    //  - the row has no real projectId (missing / 'PENDING') — e.g. an upgrade from the free bundled
    //    Basic whose AiSensy project was never materialised, so there is nothing to stop.
    // If the call runs and fails (or throws) we LOG and proceed: cancelling the Cashfree mandate (below)
    // and marking our row CANCELLED is what actually protects the customer from future charges. Billing
    // and grace at the vendor are the vendor's domain — an AiSensy hiccup must not strand the user on an
    // uncancellable plan, which is exactly what the previous hard-fail did.
    let stopMessage;
    const hasRealProject = mainSub.projectId && mainSub.projectId !== 'PENDING';
    if (process.env.NODE_ENV !== 'staging' && hasRealProject) {
        try {
            const vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey);
            const { success, message } = await stopBillingForProjectApi(mainSub.projectId, vendor);
            if (success) {
                stopMessage = message;
            } else {
                customLog(req?.LogTraceId, 'error', {
                    message: 'stopProjectBilling: AiSensy stop-project-billing failed — cancelling subscription anyway',
                    subscriptionId: mainSub.id,
                    projectId: mainSub.projectId,
                    detail: message,
                }, 'VENDOR');
            }
        } catch (stopErr) {
            customLog(req?.LogTraceId, 'error', {
                message: 'stopProjectBilling: error stopping AiSensy billing — cancelling subscription anyway',
                subscriptionId: mainSub.id,
                projectId: mainSub.projectId,
                error: stopErr?.message ?? stopErr,
            }, 'VENDOR');
        }
    }

    // AiSensy stopped (or skipped in staging) → cancel the Cashfree mandate (best-effort) so no future
    // charges fire, then mark our subscription cancelled by PK. The mandate cancel is best-effort; we
    // always mark the subscription cancelled once AiSensy has succeeded (billing/grace is the vendor's domain).
    if (mainSub.vendorSubscriptionId) {
        const cancelResult = await cancelWhatsAppSubscriptionMandate(mainSub.vendorSubscriptionId, req?.LogTraceId);
        if (!cancelResult?.status) {
            customLog(req?.LogTraceId, 'error', {
                message: 'stopProjectBilling: Cashfree mandate cancel failed — marking cancelled anyway',
                subscriptionId: mainSub.id,
                vendorSubscriptionId: mainSub.vendorSubscriptionId,
                detail: cancelResult?.message,
            }, 'VENDOR');
        }
    }

    // Mirror the Peko model: mark the row cancelled but KEEP it ACTIVE so the customer retains access
    // until the end of the current billing cycle. The Cashfree mandate is already cancelled above, so no
    // renewal will fire; the daily scheduler (subscriptionAutoRenewal) flips status → CANCELLED on the
    // end date and sends the "subscription cancelled" mail + notification then.
    const [updatedRows] = await WhatsAppSubscription.update(
        { isCancelled: true },
        { where: { id: mainSub.id, status: 'ACTIVE' } }
    );
    if (!updatedRows) return next(new ErrorResponse('Something went wrong while cancelling the subscription.', 500));

    return res.status(200).json({
        status: true,
        message: stopMessage || 'Your subscription has been cancelled. You can continue to use the service until the end of your current billing cycle.',
        responseCode: '000',
        data: {},
    });
});

exports.reactivateProjectBilling = asyncHandler(async (req, res, next) => {
    let { id } = req.body
    // F-OAB-28: the project id is client-supplied — confirm it belongs to the caller before
    // proxying to the vendor, so a foreign project id can't be reactivated (BOLA).
    const { projectId } = await fetchWhatsAppBusinessByCredentialId(req.user.id)
    if (!id || !projectId || projectId !== id) {
        return next(new ErrorResponse('Project not found', 404));
    }
    let vendor = await fetchVendorDetailsByServiceDetails(req.user, accessKey)

    const { status, message, data } = await reactivateProjectBillingApi(id, vendor)
    if (!status) return next(new ErrorResponse(message, 500));


    return res.status(200).json({
        status: true,
        message: "Project reactivated successfully",
        responseCode: '000',
        data: data
    });
});


// webhook controller for update
exports.UpdateProjectWaba = asyncHandler(async (req, res, next) => {
    const notification = req.body;
    const receivedSignature = req.headers["x-aisensy-signature"];
    customLog(req?.LogTraceId, "info", { receivedSignature, notification })
    // const pekoSecretKey = req.headers["peko-api-key"];
    let { vendor: { optional3: sharedSecret,vendorEmail:adminEmails} } = await findOneServiceOperator({ accessKey })
    
    customLog(req?.LogTraceId, "info", { hasSharedSecret: !!sharedSecret })
    const generatedSignature = await createHash(`${JSON.stringify(notification)}`, sharedSecret);
    customLog(req?.LogTraceId, "info", { generatedSignature })

    if (receivedSignature === generatedSignature) {
        if (notification.topic === "project.waba.updated") {
            const { project_id, data: { project: { plan_activated_on, plan_renewal_on ,is_whatsapp_verified} } } = notification;

            const { email, name } = await fetchWhatsAppBusinessByEmail(notification?.business_id)
            const PlanActivatedOn = formatDate(plan_activated_on)
            let partnerDetails;
            partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

            
            if(is_whatsapp_verified === true){
                 // Convert the timestamps to JavaScript Date objects
                

                 const subscriptionStartDate = new Date(plan_activated_on);
                 const subscriptionEndDate = new Date(plan_renewal_on);
                     // Update WhatsAppSubscription with the original dates
                     await WhatsAppSubscription.update(
                         {
                             subscriptionStartDate,
                             subscriptionEndDate,
                             status: 'ACTIVE',
                         },
                         {
                             where: { projectId: project_id ,status:'PENDING'},
                         }
                     );
                 

            // A project can have multiple simultaneous add-on rows (e.g. Bot Builder + Shopify
            // Integration, both created together at bundled purchase, both PENDING until WABA
            // verification) — email admins once per add-on, not just for whichever one a single
            // findOne happened to return.
            const updatedAddOnSubscriptions = await WhatsAppSubscription.findAll({
                where: { projectId: project_id ,isCustom:true}
            });

            const ADD_ON_EMAIL_RESOLVERS = {
                BOT_BUILDER: resolveEmailForBotActivated,
                SHOPIFY_INTEGRATION: resolveEmailForShopifyIntegrationActivated,
            };

            for (const updatedAddOnSubscription of updatedAddOnSubscriptions) {
                const resolveAdminEmail = ADD_ON_EMAIL_RESOLVERS[updatedAddOnSubscription.addOnType] || resolveEmailForBotActivated;
                const { subject: adminSubject, html: adminHtml, sender: adminSender } = await resolveAdminEmail(name, { logTraceId: req?.LogTraceId });

                adminEmails.map((adminEmail) => {
                emailer.email( adminEmail, adminSubject, adminHtml, function () {
                    customLog(req?.LogTraceId, "info", { message: "Email sent to " + adminEmail })
                }, adminSender);
            });
            }

            const { subject, html: emailBody, sender } = await resolveEmailForWabaUpdated(notification, name, PlanActivatedOn, partnerDetails, { partnerId: req?.user?.registeredBy || null, logTraceId: req?.LogTraceId });
            emailer.email(email, subject, emailBody, function () {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + email })
            }, sender);
            return res.status(200).json({
                status: true,
                message: "Project plan dates updated successfully",
                responseCode: '000',
                data: {}
            });
            
            }
           
        }
        // else if (notification.topic === "project.created") {
        //     const { project_id, data: { project: { plan_activated_on, plan_renewal_on } } } = notification;
        
        //     // Convert the timestamps to JavaScript Date objects
        //     const subscriptionStartDate = new Date(plan_activated_on);
        //     const subscriptionEndDate = new Date(plan_renewal_on);
        
        //     // Find the corresponding WhatsAppSubscription record by project_id and update the dates
        //     await WhatsAppSubscription.update(
        //         {
        //             subscriptionStartDate,
        //             subscriptionEndDate,
        //             status: 'ACTIVE'
        //         },
        //         {
        //             where: { projectId: project_id }
        //         }
        //     );
        
        //     return res.status(200).json({
        //         status: true,
        //         message: "Project plan dates updated successfully",
        //         responseCode: '000',
        //         data: {}
        //     });
        // }
        
    } else {
        return next(new ErrorResponse('Invalid api key', 400))
    }
})

exports.payment = asyncHandler(async (req, res, next) => {
    //check disableService?
    //search for package,cashback,serviceOperator,vendor?
    //userBalance
    //Entry for payment
    //API call
    //update the payment
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const name = req.user.name;
    const email = req.user.email
    const contactPersonName = req.user.contactPersonName;
    const { account, amount, payCashback, project_id } = req.body;
    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    // Fetch service details
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

    // Prepare transaction data
    const transactionCategory = 'WhatsApp for Business';
    const transactionId = new Date().valueOf();
    const providerId = transactionId;
    const serviceOperatorId = serviceDetails.id;
    const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
    const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
    const commissionType = serviceDetails.commissionType;
    const cashbackType = serviceDetails.cashbackType;
    const providerCommission = serviceDetails.providerCommission;
    const corporateCashback = serviceDetails.cashback;

    serviceDetails.transactionReportRule = "SERVICE_WITH_INVOICE_AND_SURCHARGE" //ONLY TEMP
    const reportData = await computeJournalData({
        serviceDetails,
        amount: Number(amount),
        paymentMethod: 'WALLET',
        partnerDetails,
        paymentGatewayName: 'WALLET',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });
    let corporateTxnId = new Date().valueOf()
    const publishJournal = (type) =>
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type,
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    let transactionResponse = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            corporateCashback,
            accountNo: account,
            transactionCategory,
            orderAmount: amount,
            commissionType,
            cashbackType,
            providerCommission,
            payCashback,
            paytmAmount: req.body.paytmAmount,
            paytmResponse: req.body.paytmResponse,
            surcharge,
            reportData
        })
    } else {
        transactionResponse = await createWalletTransaction({
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            corporateCashback,
            transactionCategory,
            surcharge,
            accountNo: account,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            payCashback,
            reportData
        })
    }

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse['error'], 500))
    }
    publishJournal('payment');
    // api call
    let { status, message, data } = await wccCreditUpdateApi(project_id, amount, serviceDetails?.vendor)
    customLog(req?.LogTraceId, "info", { data })
   
    let updateDetails = {}
    if (!status) {
        updateDetails = {
            corporateTxnId,
            status: "FAILURE",
            providerId: "Not Available",
            message: data?.message || 'Wcc Credit Update failed',
            registeredById: req.user.registeredBy,
            orderResponse: JSON.stringify(data)
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'paytmResponse')) {
            // paytm refund is pending
            await refundWalletTransaction(updateDetails)
        } else {
            await refundWalletTransaction(updateDetails)
        }
        publishJournal('refund');
        // handle notifications-----------------------
        const paymentDetails = {
            transactionId: corporateTxnId,
            account: account,
            amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
        };
        const notificationData = {
            notificationTitle: 'Payment Failed',
            notificationBrief: `The payment of ₹ ${paymentDetails.amount} for WhatsApp for Business with transaction ID ${paymentDetails.transactionId} was Failed`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN'
        };
        createNotification(notificationData);
        const serviceUrl = partnerDetails?.baseUrl;
        const to = email;
        const { subject, html: body, sender } = await resolvePaymentFailedEmail({
            key: EMAIL_TEMPLATE_KEYS.WHATSAPP_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
            name,
            serviceName: "WhatsApp for Business",
            url: serviceUrl,
            partnerDetails,
            partnerId: req.user.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });

        emailer.email(to, subject, body, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        }, sender);
        //-------------------------------------------------------

        const walletDetails = await wallet.findOne({
            where: {
                credentialId
            },
            attributes: ['balance']
        })
        return res.status(400).json({
            status: false,
            message: 'Payment Failed',
            responseCode: '001',
            data: {
                ...data,
                corporateFinalBalance: walletDetails['balance']
            }
        })
    } else {
        updateDetails = {
            corporateTxnId,
            providerId: "Not Available",
            status: "SUCCESS",
            message: "Payment Successful",
            orderResponse: JSON.stringify(data)
        };
        await updateWalletTransaction(updateDetails);
        transactionResponse.datetime = new Date()
        transactionResponse.amount = amount

        // handle email and notifications-----------------------
        const paymentDetails = {
            transactionId: corporateTxnId,
            account: account,
            amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
        };
        const { subject: emailSubject, html: emailBody, sender } = await resolveWhatsappForBusiness(name, paymentDetails.transactionId, "WhatsApp for Business", paymentDetails.amount, surcharge, partnerDetails, { partnerId: req.user.registeredBy || null, logTraceId: req?.LogTraceId });
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: parseFloat(amount) || 0,
            surcharge: surcharge || 0,
            couponDiscount: 0,
            corporateTxnId,
            orderId: transactionResponse?.orderId ?? (await findOneOrder({ corporateTxnId }))?.id,
            paymentType: "WhatsApp for Business",
            credentialId,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(email, emailSubject, emailBody, invoiceAttachments, async (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
          } else {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + email })
          }
        }, sender);
        const notificationData = {
            notificationTitle: 'Payment Successful',
            notificationBrief: `The payment of ₹ ${paymentDetails.amount} for WhatsApp for Business with transaction ID ${paymentDetails.transactionId} was successful`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN'
        };
        createNotification(notificationData);
        //-------------------------------------------------------

        return res.status(200).json({
            'status': true,
            'data': {
                ...{},
                ...transactionResponse,
                corporateTxnId
            },
            'message': 'payment successfull',
            'responseCode': '000'
        })
    }

})

exports.fetchOrders = asyncHandler(async (req, res) => {
    try {
        const { searchText, page, pageSize } = req.query;
        const offset = (page - 1) * pageSize;

        const credentialId = req.user.id;
        const packageId = req.user.packageId;
        const corporateUserId = req.user.corporateId;
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId
        });

       
        const serviceOperatorId = serviceDetails.id;

        let params = {
            credentialId,
            serviceOperatorId,
            searchText,
        }

        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const orders = await fetchOrdersByCredentialAndServiceOperator(params);
        if (!orders) {
            return res.status(200).json({
                status: true,
                message: "No Orders exists",
                responseCode: '000',
                data: {
                    orders: [],
                    pagination: {
                        currentPage: parseInt(page),
                        pageSize: parseInt(pageSize),
                        totalPages: Math.ceil(10 / parseInt(pageSize)),
                        totalOrders: 10
                    }
                }
            });
        }

        orders.sort((a, b) => {
            return new Date(b.transactionDate) - new Date(a.transactionDate);
        });

        const totalOrdersCount = orders.length;

        // Format the transactionDate to be human-readable
        const formatTransactionDate = (dateString) => {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        // Pagination
        const paginatedOrders = orders.slice(offset, offset + parseInt(pageSize));
        // Apply formatting to transactionDate for each order in paginatedOrders
        const formattedPaginatedOrders = paginatedOrders.map(order => ({
            ...order.dataValues,
            transactionDate: formatTransactionDate(order.dataValues.transactionDate),
        }));

        res.status(200).json({
            success: true,
            message: 'Orders fetched successfully',
            data: {
                orders: formattedPaginatedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(pageSize),
                    totalPages: Math.ceil(totalOrdersCount / parseInt(pageSize)),
                    totalOrders: totalOrdersCount
                }
            }
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});


exports.fetchAllplanFamilies = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = serviceDetails.vendor;
    let config = {
        method: 'get',
        url: `${URL}/partner/${PartnerId}/plans`,
        headers: {
            'Content-Type': 'application/json',
            'X-AiSensy-Partner-API-Key': `${API_Key}`
        },
    };
    let result = await axios(config)

    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching Plan Family`, 500))
    } else {
        return res.status(200).json({
            status: true,
            message: "Plan Family Fetched Successfully!!",
            responseCode: '000',
            data: result.data.planFamilies[0]
        })
    }

})

const SECRET_KEY = process.env.SECRET_KEY;

const generateToken = (email, partnerId) => {
    return jwt.sign({ email, partnerId }, SECRET_KEY, { expiresIn: '7d' }); // 1 hour token expiration
};

// SSO Login Controller
exports.ssoLogin = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = serviceDetails.vendor;

    // The token must carry the email AiSensy has on record for the linked business —
    // req.user.email can drift (sub-user click, profile email change, case difference)
    // and a mismatched email leaves the vendor SSO page spinning forever.
    const { businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);
    if (!businessId) {
        return next(new ErrorResponse('WhatsApp Business account is not linked yet. Please contact support.', 400));
    }

    let email = req.user.email;
    try {
        const { data: businesses } = await axios({
            method: 'get',
            url: `${URL}/partner/${PartnerId}/business`,
            headers: {
                'Content-Type': 'application/json',
                'X-AiSensy-Partner-API-Key': `${API_Key}`
            }
        });
        if (Array.isArray(businesses)) {
            const business = businesses.find(b => String(b.business_id ?? b.id ?? b._id) === String(businessId));
            if (!business?.email) {
                customLog(req?.LogTraceId, 'error', { message: 'ssoLogin: linked business not found at vendor', businessId }, 'VENDOR');
                return next(new ErrorResponse('Your WhatsApp Business account could not be verified with the vendor. Please contact support.', 400));
            }
            email = business.email;
        }
    } catch (error) {
        // Vendor lookup failed (network/5xx) — fall back to the credential email rather than blocking SSO
        customLog(req?.LogTraceId, 'error', { message: 'ssoLogin: vendor business lookup failed', error: error?.response?.data ?? error?.message }, 'VENDOR');
    }

    // Validate email and partnerId
    if (!email || !PartnerId) {
        return next(new ErrorResponse('Email and partnerId are required.', 400));
    }

    // Generate the JWT token
    const token = generateToken(email, PartnerId);

    if (!token) {
        return next(new ErrorResponse('Something went wrong while generating the token', 500));
    } else {
        return res.status(201).json({
            status: true,
            data: {
                redirectLink: process.env.REDIRECT_URL,
                token: token
            },
            message: 'Redirect URL and token created successfully',
            responseCode: '000'
        });
    }
});

exports.fetchPlanDetails = asyncHandler(async (req, res) => {

    try {
        const accessCode = req.query.accessKey
        const partnerId = req.user.registeredBy
        const credentialId = req.user.id;
        let servicePurchaseDetails
        let activeSubscriptions;
        let activeAddOns
        let activeShopifyAddOn
        if (accessCode) {
            activeSubscriptions = await findActiveSubscriptionByCredentialId(credentialId);
            activeAddOns = await findActiveBotBuilderByCredentialId(credentialId);
            activeShopifyAddOn = await findActiveShopifyIntegrationByCredentialId(credentialId);
            servicePurchaseDetails = await findPackageByAccessCode(accessCode, partnerId, credentialId)
        } else {
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch Package details',
                data: {},
                responseCode: '001'
            });
        }

        if (!servicePurchaseDetails.length) {
            return res.status(400).json({
                status: false,
                message: 'Failed to fetch Package details',
                data: {},
                responseCode: '001'
            });
        }

        removeCommissionFields(servicePurchaseDetails, [...PLAN_COMMISSION.fields, "planCommissions"]);

        const discountPrice = computeUpgradeCredit(activeSubscriptions)
            + computeUpgradeCredit(activeAddOns)
            + computeUpgradeCredit(activeShopifyAddOn);

        // Server-side annotation so the frontend doesn't have to mirror the BASIC/PRO mapping
        // and can't fall out of sync with the active subscription state. isPurchased = the
        // current user is on this exact plan tier (regardless of billing duration);
        // purchasedBillingType lets the UI compare against the currently-selected duration.
        const activeBillingPlan = activeSubscriptions?.billingPlan
            ? String(activeSubscriptions.billingPlan).toUpperCase()
            : null;
        const activeBillingType = activeSubscriptions?.billingType
            ? String(activeSubscriptions.billingType).toUpperCase()
            : null;
        const planNameToTier = (name) => {
            const upper = String(name || "").toUpperCase();
            if (upper.includes("PRO")) return "PRO";
            if (upper.includes("BASIC")) return "BASIC";
            return null;
        };
        const annotatedPackageDetails = servicePurchaseDetails.map((plan) => {
            const tier = planNameToTier(plan.packageName);
            const isPurchased = !!activeBillingPlan && !!tier && tier === activeBillingPlan;
            return {
                ...plan,
                isPurchased,
                purchasedBillingType: isPurchased ? activeBillingType : null,
            };
        });

        return res.status(200).json({
            status: true,
            message: 'Package details fetched successfully',
            data: {
                packageDetails: annotatedPackageDetails,
                discountPrice: discountPrice ? discountPrice.toFixed(2) : null,
                activeSubscription: activeSubscriptions
                    ? {
                          id: activeSubscriptions.id,
                          billingPlan: activeBillingPlan,
                          billingType: activeBillingType,
                          packageName: activeSubscriptions.package?.packageName ?? null,
                          subscriptionEndDate: activeSubscriptions.subscriptionEndDate ?? null,
                      }
                    : null,
            },
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch Package details',
            data: {},
            responseCode: '001'
        });
    }
})


exports.getPurchaseHistory = asyncHandler(async (req, res) => {

    const corporateId = req.user.corporateId;
    const partnerId = req.user.registeredBy
    let { status, page, itemsPerPage, packageType,searchText } = req.query;

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    let params = {
        limit,
        offset,
        corporateId,
        status,
        packageType,
        searchText
    }
    try {
        const activeSubscriptions = await findAndCountAllUserSubscriptions(params)
        if (!activeSubscriptions) {
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch purchase history',
                data: {},
                responseCode: '001'
            });
        }
        activeSubscriptions.rows = activeSubscriptions.rows.map(subscription => {
            if (subscription.isCustom) {
                subscription.package = subscription.package || {}
                subscription.package.packageName = "Add on";
            }
            return subscription;
        });
        return res.status(200).json({
            status: true,
            message: 'Subscription history fetched successfully',
            data: {
                activeSubscriptions
            },
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while fetching purchase history',
            data: {},
            responseCode: '001'
        });
    }
})
exports.getActiveSubscription = asyncHandler(async (req, res) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const isExpiry = req.query.isExpiry
    try {
        console.log("credentialId",credentialId)
        const activeSubscriptions = await findActiveSubscriptionByCredentialId(credentialId)

        if (!activeSubscriptions && isExpiry) {
            const lastExpiredWhatsAppSubscription = await findLastExpiredWhatsAppSubscription({ corporateId });
            removeCommissionFields(lastExpiredWhatsAppSubscription?.package, [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag, "planCommissions"]);
            
            return res.status(200).json({
                status: true,
                message: 'Last expired WhatsApp subscription fetched successfully',
                data: {
                    activeSubscriptions:lastExpiredWhatsAppSubscription
                },
                responseCode: '000'
            });
        }
        
        if (!activeSubscriptions) {
            return res.status(200).json({
                status: false,
                message: 'Subscription fetched successfully',
                data: {},
                responseCode: '000'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Subscription fetched successfully',
            data: {
                activeSubscriptions
            },
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while fetching active subscription',
            data: {},
            responseCode: '001'
        });
    }
})

exports.getActiveBotBuilder = asyncHandler(async (req, res) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const isExpiry = req.query.isExpiry
    try {
        const activeSubscriptions = await findActiveBotBuilderByCredentialId(credentialId)

        if (!activeSubscriptions && isExpiry) {
            const lastExpiredWhatsAppSubscription = await findLastExpiredBotBuilderSubscription({ corporateId });
            removeCommissionFields(lastExpiredWhatsAppSubscription?.package, [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag, "planCommissions"]);
            
            return res.status(200).json({
                status: true,
                message: 'Last expired BotBuilder subscription fetched successfully',
                data: {
                    activeSubscriptions:lastExpiredWhatsAppSubscription
                },
                responseCode: '000'
            });
        }
        if (!activeSubscriptions) {
            return res.status(200).json({
                status: false,
                message: 'Bot builder fetched successfully',
                data: {},
                responseCode: '000'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Bot builder fetched successfully',
            data: {
                activeSubscriptions
            },
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while fetching active Bot builder',
            data: {},
            responseCode: '001'
        });
    }
})
exports.stopBotBuilder = asyncHandler(async (req,res) => {
    const { id } = req.body

    const isStopped = await stopBotBuilderStatus(id)
    if(!isStopped){
        return res.status(500).json({
            status: false,
            responseCode: '001',
            message: "Stop billing for add ons failed.",
            data: isStopped
        });
    }

    return res.status(200).json({
        status: true,
        message: 'Bot builder subscription cancelled',
        data: {},
        responseCode: '000'
    });
})

exports.getActiveShopifyIntegration = asyncHandler(async (req, res) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const isExpiry = req.query.isExpiry
    try {
        const activeSubscriptions = await findActiveShopifyIntegrationByCredentialId(credentialId)

        if (!activeSubscriptions && isExpiry) {
            const lastExpiredWhatsAppSubscription = await findLastExpiredShopifyIntegrationSubscription({ corporateId });
            removeCommissionFields(lastExpiredWhatsAppSubscription?.package, [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag, "planCommissions"]);

            return res.status(200).json({
                status: true,
                message: 'Last expired Shopify Integration subscription fetched successfully',
                data: {
                    activeSubscriptions:lastExpiredWhatsAppSubscription
                },
                responseCode: '000'
            });
        }
        if (!activeSubscriptions) {
            return res.status(200).json({
                status: false,
                message: 'Shopify Integration fetched successfully',
                data: {},
                responseCode: '000'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Shopify Integration fetched successfully',
            data: {
                activeSubscriptions
            },
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while fetching active Shopify Integration',
            data: {},
            responseCode: '001'
        });
    }
})
exports.stopShopifyIntegration = asyncHandler(async (req,res) => {
    const { id } = req.body

    const isStopped = await stopShopifyIntegrationStatus(id)
    if(!isStopped){
        return res.status(500).json({
            status: false,
            responseCode: '001',
            message: "Stop billing for add ons failed.",
            data: isStopped
        });
    }

    return res.status(200).json({
        status: true,
        message: 'Shopify Integration subscription cancelled',
        data: {},
        responseCode: '000'
    });
})
exports.getBotBuilderAmount  = asyncHandler(async (req, res) => {
    try {
        const Setting = await setting.findOne({
            where: { name:'flowBuilder' },
        });

        if (!Setting) {
            return res.status(200).json({
                status: false,
                message: 'Bot builder amount fetched successfully',
                data: {},
                responseCode: '000'
            });
        }
        const details = Setting.dataValues.details;
        await applyCommissionMarkup(details, 'amount', req.user.id);

        // Add the new field
        const updatedDetails = { 
            ...details, 
            yearlyAmount: Number((details.amount * 12).toFixed(2)) 
        };

        return res.status(200).json({
            status: true,
            message: 'Bot builder amount fetched successfully',
            data: removeCommissionFields(updatedDetails, [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag]),
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while fetching Bot builder amount',
            data: {},
            responseCode: '001'
        });
    }
})

exports.getShopifyIntegrationAmount  = asyncHandler(async (req, res) => {
    try {
        const Setting = await setting.findOne({
            where: { name:'shopifyIntegration' },
        });

        if (!Setting) {
            return res.status(200).json({
                status: false,
                message: 'Shopify Integration amount fetched successfully',
                data: {},
                responseCode: '000'
            });
        }
        const details = Setting.dataValues.details;
        await applyCommissionMarkup(details, 'amount', req.user.id);

        // Add the new field
        const updatedDetails = {
            ...details,
            yearlyAmount: Number((details.amount * 12).toFixed(2))
        };

        return res.status(200).json({
            status: true,
            message: 'Shopify Integration amount fetched successfully',
            data: removeCommissionFields(updatedDetails, [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag]),
            responseCode: '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while fetching Shopify Integration amount',
            data: {},
            responseCode: '001'
        });
    }
})

exports.getLastWhatsAppSubscription = asyncHandler(async (req, res) => {
    try {
        const corporateId = req.user.corporateId;
        const partnerId = req.user.registeredBy;

        // Fetch the current active subscription
        const currentSubscription = await findCurrentWhatsAppSubscription({ corporateId, partnerId });
        let isPurchased = false;
        if (currentSubscription) {
            isPurchased = true;
        }

        // Fetch the last expired subscription
        let previousSubscription = await findLastExpiredWhatsAppSubscription({ corporateId });
        if (previousSubscription) {
            previousSubscription = {
                ...previousSubscription,
                packageName: previousSubscription.package.packageName,
            };
            delete previousSubscription.package;
        } else {
            previousSubscription = null;
        }

        return res.status(200).json({
            status: true,
            message: 'WhatsApp Subscription details fetched successfully',
            data: {
                isPurchased: isPurchased,
                previousSubscription: previousSubscription,
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch WhatsApp Subscription details',
            data: {},
            responseCode: '001',
        });
    }
});

exports.findTransactionDetails = asyncHandler(async (req, res) => {
    try {
      let subscriptionId = req.params.subscriptionId;
      const { id, contactPersonName, name } = req.user;
  
      if (subscriptionId) {
        const result = await findOne({ credentialId: id, id: subscriptionId });
  
        if (!result) {
          return res.status(500).json({
            status: false,
            message: "Plan details not found.",
            data: {},
            responseCode: "001",
          });
        }
  
        if (result?.invoiceId) {
        //   // invoice with zoho
        //   const invoicePdf = await getInvoicePDF({
        //     invoice_id: result?.invoiceId,
        //   });
  
        //   return res.status(200).json({
        //     status: true,
        //     message: "Invoice generated successfully.",
        //     data: {
        //       pdfBuffer: invoicePdf.content,
        //     },
        //     responseCode: "000",
        //   });
        } else {
  
          const receiptPdf = null;
          return res.status(200).json({
            status: true,
            message: "Invoice generated successfully.",
            data: {
              pdfBuffer: receiptPdf.content,
            },
            responseCode: "000",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message: "Plan ID not provided",
          data: {},
          responseCode: "001",
        });
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return res.status(500).json({
        status: false,
        message: "Something went wrong, please try again later.",
        data: {},
        responseCode: "001",
      });
    }
  });