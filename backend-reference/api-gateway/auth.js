const { getValue } = require("./redisCacheDataMethods");
const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require('path')
const { parseSystemUserPath, assertSystemUserSession, parseCorporatePath, assertSessionOwnsPath } = require("./systemUserGate");

const publicKey = fs.readFileSync(path.join(__dirname, 'keys', 'rsa.key.pub'), 'utf8')

function isDynamicRoute(url) {
    const dynamicPattern = /^\/api\/v1\/[^/]+\/[^/]+\/paymentGateway\/ni-payments\/callback\/[^/]+\?.*$/;
    // officeAndBusiness's e-sign webhook handler calls this server-to-server, with
    // no user session — employeeId varies, so it can't be a plain noAuthUrls entry.
    const esignCallbackPattern = /^\/api\/v1\/payroll\/esign-callback\/employee\/[^/]+\/offer-letter-status$/;

    return dynamicPattern.test(url) || esignCallbackPattern.test(url);
}

function isRfqInviteTokenRoute(url) {
    const rfqInviteTokenPattern = /^\/api\/v1\/invite\/rfq-invite\/purchase\/[^/]+(\/submit)?(\?.*)?$/;

    return rfqInviteTokenPattern.test(url);
}

function isPOInviteTokenRoute(url) {
    const poInviteTokenPattern = /^\/api\/v1\/invite\/po-invite\/purchase\/[^/]+(\/acknowledge)?(\?.*)?$/;

    return poInviteTokenPattern.test(url);
}

// Check if the URL should bypass authentication
function shouldBypassAuth(url) {
    return noAuthUrls[url.split('?')[0]] || isDynamicRoute(url) || isRfqInviteTokenRoute(url) || isPOInviteTokenRoute(url);
}

// Check if the URL should bypass session
function shouldBypassSession(url) {
    return noSessionUrls[url.split('?')[0]] || isDynamicRoute(url) || isRfqInviteTokenRoute(url) || isPOInviteTokenRoute(url);
}

// Public routes that must still learn WHO is calling when a session is presented (e.g. OIDC consent binds the
// auth code to the logged-in user, never to a body-supplied id). With credentials they go through the normal
// session check; without them they stay public and the service decides.
function isOptionalAuthWithCredentials(req) {
    return !!(optionalAuthUrls[req.url.split('?')[0]] && req.headers.authorization && req.headers.sessionid);
}

exports.setupAuth = async (req, res, next) => {
    try {
        let URL = req.url
        delete req.headers.userdata
        delete req.headers['x-user-key']
        delete req.headers['x-client-ip']
        if (req.ip) req.headers['x-client-ip'] = req.ip
        const enforceSession = isOptionalAuthWithCredentials(req)
        if (!enforceSession && shouldBypassSession(URL)) {
            next()
        } else {
            if (!req.headers.sessionid) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid session',
                    data: {},
                    responseCode: '002'
                })
            } else {
                if (!enforceSession && shouldBypassAuth(URL)) {
                    next()
                } else {
                    if (!req.headers.authorization) {
                        return res.status(400).json({
                            status: false,
                            message: 'token not provided',
                            data: {},
                            responseCode: '002'
                        })
                    }
                    let token = req.headers.authorization.split(' ')[1]
                    const verify = jwt.verify(token, publicKey, {
                        algorithms: ["RS256"],
                        issuer: process.env.ISSUER,
                        subject: process.env.SUBJECT,
                        audience: process.env.AUDIENCE,
                    })
                    let userId = verify.userId
                    let sessionId = req.headers.sessionid
                    let redisUniqueKey = `${userId}_${sessionId}`
                    if (req.headers.sessionuuid) {
                        redisUniqueKey = `${req.headers.sessionuuid}`
                    }
                    let cachedToken = await getValue(`token_${redisUniqueKey}`);
                    if (cachedToken && cachedToken == token) {
                        let userData = await getValue(`userData_${redisUniqueKey}`);
                        if (!userData) {
                            return res.status(400).json({
                                status: false,
                                message: 'Invalid session',
                                data: {},
                                responseCode: '002'
                            })
                        }

                        const systemUserPath = parseSystemUserPath(URL);
                        if (systemUserPath) {
                            const gate = assertSystemUserSession(userData, systemUserPath.pathUserId);
                            if (!gate.ok) {
                                return res.status(401).json({
                                    status: false,
                                    message: gate.message,
                                    data: {},
                                    responseCode: '001'
                                })
                            }
                        }
                        
                        const corporatePath = parseCorporatePath(URL);
                        if (corporatePath) {
                            const corpGate = assertSessionOwnsPath(userData, corporatePath.pathUserId);
                            if (!corpGate.ok) {
                                return res.status(403).json({
                                    status: false,
                                    message: corpGate.message,
                                    data: {},
                                    responseCode: '001'
                                })
                            }
                        }

                        req.headers['x-user-key'] = `${userId}_${sessionId}`
                        next()
                    } else {
                        return res.status(400).json({
                            status: false,
                            message: 'token not valid',
                            data: {},
                            responseCode: '002'
                        })
                    }
                }

            }

        }
    } catch (e) {
        console.log("---setupAuth---",e.message)
        return res.status(400).json({
            status: false,
            message: 'Invalid session',
            data: {},
            responseCode: '002'
        })
    }

}

exports.parseSystemUserPath = parseSystemUserPath;
exports.assertSystemUserSession = assertSystemUserSession;

let optionalAuthUrls = {
    "/api/v1/user/consent": true,
}

let noAuthUrls = {
    "/api/v1/user/login": true,
    "/api/v1/user/authorize": true,
    "/api/v1/user/consent": true,
    "/api/v1/user/token": true,
    "/api/v1/user/userinfo": true,
    "/api/v1/user/token-exchange": true,
    "/api/v1/user/oauth-callback": true,
    "/api/v1/user/password-policy/passwordPolicies":true,
    "/api/v1/user/passwordExpiryReset": true,
    "/api/v1/user/checkTokenValidity": true,
    "/api/v1/user/verify-tax-id":true,
    "/api/v1/user/saveDocs":true,
    "/api/v1/user/refresh-token": true,
    "/api/v1/user/otp": true,
    "/api/v1/user/validate": true,
    "/api/v1/user/verify-emailOtp": true,
    "/api/v1/user/signUp": true,
    "/api/v1/user/general/indian-states": true,
    "/api/v1/user/forgotPassword": true,
    "/api/v1/user/resetPassword": true,
    "/api/v1/vendor/policy-bazaar/purchase/insurance/update": true,
    "/api/v1/webhook/sign-desk/officeAndBusiness/e-sign/update-status": true,
    "/api/v1/webhook/sign-desk/officeAndBusiness/e-sign/update-audit-trail": true,
    "/api/v1/webhook/authbridge/officeAndBusiness/e-sign/update-status": true,
    "/api/v1/webhook/corporatecard/officeAndBusiness/e-sign/corporate-card/dispatch": true,
    "/api/v1/webhook/corporatecard/officeAndBusiness/e-sign/corporate-card/status": true,
    "/api/v1/webhook/officeandbusiness/corporate-cards/e-sign/status": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/physical-card-purchase": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/in-app/eligibility": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/in-app/redeem": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/in-app/cancel": true,
    "/api/v1/webhook/aisensy/officeAndBusiness/whatsapp-for-business/project-waba-update": true,
    "/api/v1/webhook/decentro/officeAndBusiness/payment-links/update":true,
    "/api/v1/webhook/decentro/officeAndBusiness/payment-links/kyb":true,
    "/api/v1/webhook/decentro/officeAndBusiness/invoicing/payment-status":true,
    "/api/v1/webhook/decentro/payment/payment-links/verify-payment":true,
    "/api/v1/webhook/decentro/payment/enach-mandate/verify-payment":true,
    "/api/v1/webhook/decentro/payment/payout/update":true,
    "/api/v1/webhook/decentro/payment/settlement/callback":true,
    "/api/v1/webhook/decentro/payroll/payout/update":true,
    "/api/v1/webhook/droom/payment/challan-status":true,
    "/api/v1/webhook/nupay/payment/payment-links/callback":true,
    "/api/v1/webhook/nupay/payment/payment-links/settlement":true,
    "/api/v1/webhook/nupay/payment/payout/update":true,
    "/api/v1/webhook/nupay/payment/wallet/credit":true,
    "/api/v1/webhook/nupay/payment/onboarding/status":true,
    "/api/v1/webhook/nupay/payment/refund":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/pg":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/return":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/subscription":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/subscription/redirect":true,
    "/api/v1/webhook/razorpay/payment-gateway/razorpay":true,
    "/api/v1/webhook/ccavenue/payment-gateway/ccavenue/response":true,
    "/api/v1/webhook/airpay/payment-gateway/airpay/response":true,
    "/api/v1/webhook/airpay/payment-gateway/airpay/ipn":true,
    "/api/v1/webhook/mswipe/payment-gateway/mswipe/return":true,
    "/api/v1/webhook/mswipe/payment-gateway/mswipe/notify":true,
    "/api/v1/webhook/jri/payment-gateway/jri/prepaid/push-url":true,
    "/api/v1/webhook/jri/payment-gateway/jri/prepaid/reverse-url":true,
    "/api/v1/webhook/xoxoday/payment-gateway/xoxoday/order-status":true,
    "/api/v1/quotation/respond":true,
    "/api/v1/webhook/pinelabs/corporate-cards/jit":true,
    "/api/v1/webhook/pinelabs/corporate-cards/callback":true,
    "/api/v1/webhook/pinelabs/corporate-cards/kyc":true,
    "/api/v1/peko/general/officeAndBusiness/ecommerce/all-plans": true,
    "/api/v1/vendor/ship-rocket/travel/logistics/shipment-status": true,
    "/api/v1/invite/rfq-invite/purchase": true,
    "/api/v1/invite/rfq-invite/purchase/submit": true,
    "/api/v1/invite/po-invite/purchase": true,
    "/api/v1/invite/po-invite/purchase/acknowledge": true,
    "/api/v1/invite/po-invite/purchase/pdf": true,
    "/api/v1/webhook/base93/officeAndBusiness/company-incorporation/status": true,
    "/api/v1/webhook/india-filings/officeAndBusiness/india-filings/callback": true,
    "/api/v1/webhook/nupay/officeAndBusiness/verification-suite/callback": true,
    "/api/v1/user/privacy-policy-details": true,
    "/api/v1/user/privacy-policy-details/enforcement": true,
    "/api/v1/webhook/nupay/payment/onboarding-status": true,
    // TEMP: BBPS proxy-api test endpoint — exposed publicly for vendor/QA testing.
    // Route is defined in payment/routes/API/v1/webhook/bbpsTest.js. Remove both together.
    "/api/v1/webhook/bbps/payment/proxy-api": true,
    "/search": true,
    "/on_search": true,
    "/api/v1/vendor/vasco/travel/visa/update-status": true,
    "/api/v1/vendor/vasco/travel/visa/update-document-status": true,
    "/api/v1/webhook/ondc/purchase/on_search": true,
    "/api/v1/webhook/ondc/purchase/on_select": true,
    "/api/v1/webhook/ondc/purchase/on_init": true,
    "/api/v1/webhook/ondc/purchase/on_confirm": true,
    "/api/v1/webhook/pinelabs/corporate-cards/wallet-topup": true,
    "/api/v1/webhook/pinelabs/corporate-cards/card-notification": true,
    "/api/v1/webhook/ondc/purchase/on_track": true,
    "/api/v1/webhook/ondc/purchase/on_status": true,
    "/api/v1/webhook/ondc/purchase/on_return": true,
    "/api/v1/webhook/ondc/purchase/on_update": true,
    "/api/v1/webhook/ondc/purchase/on_issue": true,
    "/api/v1/webhook/ondc/purchase/on_cancel": true,
    "/api/v1/webhook/ondc/purchase/on_issue_Status": true,
    "/api/v1/webhook/scheduler/corporate-cards/cron/in-app-payment-sweep": true,
    "/api/v1/webhook/droom/officeAndBusiness/vehicle-reports/valuation_callback": true,
    "/api/v1/webhook/droom/officeAndBusiness/vehicle-reports/inspection_callback": true,
    "/api/v1/webhook/scheduler/corporate-cards/cron/daily-balance-reminder-sweep": true,
}

let noSessionUrls = {
    "/api/v1/user/login": true,
    "/api/v1/user/authorize": true,
    "/api/v1/user/consent": true,
    "/api/v1/user/token": true,
    "/api/v1/user/userinfo": true,
    "/api/v1/user/token-exchange": true,
    "/api/v1/user/oauth-callback": true,
    "/api/v1/user/refresh-token": true,
    "/api/v1/user/otp": true,
    "/api/v1/user/password-policy/passwordPolicies":true,
    "/api/v1/user/verify-tax-id":true,
    "/api/v1/user/saveDocs":true,
    "/api/v1/user/passwordExpiryReset": true,
    "/api/v1/user/validate": true,
    "/api/v1/user/verify-emailOtp": true,
    "/api/v1/user/forgotPassword": true,
    "/api/v1/user/resetPassword": true,
    "/api/v1/user/signUp": true,
    "/api/v1/user/general/indian-states": true,
    "/api/v1/vendor/policy-bazaar/purchase/insurance/update": true,
    "/api/v1/webhook/sign-desk/officeAndBusiness/e-sign/update-status": true,
    "/api/v1/webhook/sign-desk/officeAndBusiness/e-sign/update-audit-trail": true,
    "/api/v1/webhook/authbridge/officeAndBusiness/e-sign/update-status": true,
    "/api/v1/webhook/corporatecard/officeAndBusiness/e-sign/corporate-card/dispatch": true,
    "/api/v1/webhook/corporatecard/officeAndBusiness/e-sign/corporate-card/status": true,
    "/api/v1/webhook/officeandbusiness/corporate-cards/e-sign/status": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/physical-card-purchase": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/in-app/eligibility": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/in-app/redeem": true,
    "/api/v1/webhook/paymentgateway/corporate-cards/in-app/cancel": true,
    "/api/v1/webhook/aisensy/officeAndBusiness/whatsapp-for-business/project-waba-update": true,
    "/api/v1/user/checkTokenValidity": true,
    "/api/v1/webhook/decentro/officeAndBusiness/payment-links/update":true,
    "/api/v1/webhook/decentro/officeAndBusiness/payment-links/kyb":true,
    "/api/v1/webhook/decentro/officeAndBusiness/invoicing/payment-status":true,
    "/api/v1/webhook/decentro/payment/payout/update":true,
    "/api/v1/webhook/decentro/payment/settlement/callback":true,
    "/api/v1/webhook/decentro/payroll/payout/update":true,
    "/api/v1/webhook/droom/payment/challan-status":true,
    "/api/v1/webhook/nupay/payment/payment-links/callback":true,
    "/api/v1/webhook/nupay/payment/payment-links/settlement":true,
    "/api/v1/webhook/nupay/payment/payout/update":true,
    "/api/v1/webhook/nupay/payment/wallet/credit":true,
    "/api/v1/webhook/nupay/payment/onboarding/status":true,
    "/api/v1/webhook/nupay/payment/refund":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/pg":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/return":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/subscription":true,
    "/api/v1/webhook/cashfree/payment-gateway/cashfree/subscription/redirect":true,
    "/api/v1/webhook/razorpay/payment-gateway/razorpay":true,
    "/api/v1/webhook/ccavenue/payment-gateway/ccavenue/response":true,
    "/api/v1/webhook/airpay/payment-gateway/airpay/response":true,
    "/api/v1/webhook/airpay/payment-gateway/airpay/ipn":true,
    "/api/v1/webhook/mswipe/payment-gateway/mswipe/return":true,
    "/api/v1/webhook/mswipe/payment-gateway/mswipe/notify":true,
    "/api/v1/webhook/jri/payment-gateway/jri/prepaid/push-url":true,
    "/api/v1/webhook/jri/payment-gateway/jri/prepaid/reverse-url":true,
    "/api/v1/webhook/xoxoday/payment-gateway/xoxoday/order-status":true,
    "/api/v1/quotation/respond":true,
    "/api/v1/webhook/pinelabs/corporate-cards/jit":true,
    "/api/v1/webhook/pinelabs/corporate-cards/callback":true,
    "/api/v1/webhook/pinelabs/corporate-cards/kyc":true,
    "/api/v1/peko/general/officeAndBusiness/ecommerce/all-plans": true,
    "/api/v1/webhook/decentro/payment/payment-links/verify-payment":true,
    "/api/v1/webhook/decentro/payment/enach-mandate/verify-payment":true,
    "/api/v1/vendor/ship-rocket/travel/logistics/shipment-status": true,
    "/api/v1/webhook/nupay/payment/onboarding-status": true,
    "/api/v1/invite/rfq-invite/purchase": true,
    "/api/v1/invite/rfq-invite/purchase/submit": true,
    "/api/v1/invite/po-invite/purchase": true,
    "/api/v1/invite/po-invite/purchase/acknowledge": true,
    "/api/v1/invite/po-invite/purchase/pdf": true,
    "/api/v1/webhook/base93/officeAndBusiness/company-incorporation/status": true,
    "/api/v1/webhook/india-filings/officeAndBusiness/india-filings/callback": true,
    "/api/v1/webhook/nupay/officeAndBusiness/verification-suite/callback": true,
    "/api/v1/user/privacy-policy-details": true,
    "/api/v1/user/privacy-policy-details/enforcement": true,
    // TEMP: BBPS proxy-api test endpoint — exposed publicly for vendor/QA testing.
    // Route is defined in payment/routes/API/v1/webhook/bbpsTest.js. Remove both together.
    "/api/v1/webhook/bbps/payment/proxy-api": true,
    "/search": true,
    "/on_search": true,
    "/api/v1/vendor/vasco/travel/visa/update-status": true,
    "/api/v1/vendor/vasco/travel/visa/update-document-status": true,
    "/api/v1/webhook/ondc/purchase/on_search": true,
    "/api/v1/webhook/ondc/purchase/on_select": true,
    "/api/v1/webhook/ondc/purchase/on_confirm": true,
    "/api/v1/webhook/ondc/purchase/on_init": true,
    "/api/v1/webhook/pinelabs/corporate-cards/wallet-topup": true,
    "/api/v1/webhook/pinelabs/corporate-cards/card-notification": true,
    "/api/v1/webhook/ondc/purchase/on_status": true,
    "/api/v1/webhook/ondc/purchase/on_track": true,
    "/api/v1/webhook/ondc/purchase/on_return": true,
    "/api/v1/webhook/ondc/purchase/on_cancel": true,
    "/api/v1/webhook/ondc/purchase/on_update": true,
    "/api/v1/webhook/ondc/purchase/on_issue": true,
    "/api/v1/webhook/ondc/purchase/on_issue_Status": true,
    "/api/v1/webhook/scheduler/corporate-cards/cron/in-app-payment-sweep": true,
    "/api/v1/webhook/droom/officeAndBusiness/vehicle-reports/valuation_callback": true,
    "/api/v1/webhook/droom/officeAndBusiness/vehicle-reports/inspection_callback": true,
    "/api/v1/webhook/scheduler/corporate-cards/cron/daily-balance-reminder-sweep": true,
}
