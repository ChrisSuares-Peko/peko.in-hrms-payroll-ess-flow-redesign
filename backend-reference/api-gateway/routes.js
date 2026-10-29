let paths;
// eslint-disable-next-line no-undef
switch (process.env.NODE_ENV) {
    case "production":
        paths = require("./config/api_configs.json").production;
        break;
    case "staging":
        paths = require("./config/api_configs.json").staging;
        break;
    default:
        paths = require("./config/api_configs.json").local;
        break;
}

const ROUTES = [
    {
        url: '/api/v1/public/rfq-invite',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.purchase,
            changeOrigin: true,
        }
    },
    {
        url: '/api/v1/public/po-invite',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.purchase,
            changeOrigin: true,
        }
    },
    {
        url: '/api/v1/:userType/:userId/purchase',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.purchase,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/purchase/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/payment',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.payment,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/payment/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/travel',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.travel,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/travel/`]: '',
            },
        }
    },
    {
        url: '/api/v1/quotation',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.officeAndBusiness,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/quotation`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/officeAndBusiness',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.officeAndBusiness,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/officeAndBusiness/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/others',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.others,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/others/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/kyc',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.kyc,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/kyc/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/payment-gateway',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            // target: "http://localhost:4442",
            target: paths.paymentGateway,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/payment-gateway/`]: '',
            },
        }
    },
    {
        // The esign-callback path is hit server-to-server by officeAndBusiness's
        // webhook handler (no user session), hence the separate no-session pattern.
        url: ['/api/v1/:userType/:userId/payroll', '/api/v1/payroll/esign-callback'],
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.payroll,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/payroll/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/scheduler',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.scheduler,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/scheduler/`]: '',
            },
        }
    },
    {
        url: '/api/v1/:userType/:userId/corporate-cards',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.corporateCard,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/corporate-cards/`]: '',
            },
        }
    },
    {
        url: '/search',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.purchase,
            changeOrigin: true,
        }
    },
    {
        url: '/on_search',
        creditCheck: false,
        auth: false,
        rateLimit: {},
        proxy: {
            target: paths.purchase,
            changeOrigin: true,
        }
    },
    // NOTE: keep this LAST. It is a prefix match for everything under /api/v1/user
    // (auth endpoints: login, signUp, refresh-token, sub-corporate, ess, ...). The
    // specific /api/v1/:userType/:userId/<service> routes above must be matched
    // first so that USER-role downstream calls (e.g. /api/v1/user/:id/payroll/...)
    // reach their service instead of being swallowed by the auth proxy.
    {
        url: '/api/v1/user',
        creditCheck: false,
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 25
        },
        proxy: {
            target: paths.users,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/user/`]: '',
            },
        }
    },
];

exports.ROUTES = ROUTES;