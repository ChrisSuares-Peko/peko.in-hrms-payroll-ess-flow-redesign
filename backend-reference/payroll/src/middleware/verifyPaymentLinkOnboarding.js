
const asyncHandler = require('./async');

const verifyPaymentLinkOnboarding = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?._id;

    if (!corporateId) {
        return res.status(400).json({
            status: false,
            message: 'Credential (user) id missing',
            responseCode: '001',
            data: null,
        });
    }

    // const serverUrl = process.env.SERVER_URL;
    // const url = `${serverUrl}/api/v1/corporate/${corporateId}/payment/payment-links/onboarding/status`;

    try {
        // const { data } = await axios.get(url, {
        //     timeout: 10000,
        //     headers: req.headers,
        // });
        next()
        return

        // const record = data?.data;
        // if (!record || String(record.status || '').toLowerCase() !== 'active') {
        //     return res.status(403).json({
        //         status: false,
        //         message: 'Payment link onboarding is not completed. Please complete onboarding to continue.',
        //         responseCode: '403',
        //         data: { onboardingCompleted: false, onboardingStatus: record?.status || null },
        //     });
        // }

        // return next();
    } catch (err) {
        if (err.response?.data?.data?.onboardingCompleted === false) {
            return res.status(403).json({
                status: false,
                message: 'Payment link onboarding is not completed. Please complete onboarding to continue.',
                responseCode: '403',
                data: { onboardingCompleted: false },
            });
        }
        const message = err.response?.data?.message || err.message || 'Failed to verify onboarding status';
        return res.status(err.response?.status || 500).json({
            status: false,
            message,
            responseCode: '001',
            data: null,
        });
    }
});

module.exports = verifyPaymentLinkOnboarding;
