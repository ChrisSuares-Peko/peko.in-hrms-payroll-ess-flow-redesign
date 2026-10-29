const { createPrivacyPolicyAcceptance, getPendingPrivacyPolicies } = require('../../models/use-cases/privacyPolicy');
const { actingCredentialId } = require('../../utils/actingCredential');
const asyncHandler = require('../../middlewares/async');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const userAgent = require('express-useragent');


const expiryCalculationFn = (expiry) => {
    const match = expiry.match(/^(\d+)([smhd])$/); // Regex to extract value and unit
    if (!match) {
        throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10); // Numeric part
    const unit = match[2]; // Unit part (s, m, h, d)

    // Convert to seconds
    switch (unit) {
        case 's': return value; // seconds
        case 'm': return value * 60; // minutes
        case 'h': return value * 60 * 60; // hours
        case 'd': return value * 60 * 60 * 24; // days
        default: throw new Error(`Unsupported time unit: ${unit}`);
    }
};

exports.acceptPrivacyPolicy = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.headers.sessionid;
    const source = req.headers['user-agent'];
    const ua = userAgent.parse(source);
   
    // The SAME credential the gate in utils/jwtToken.js refuses on. Resolving the employer's here instead
    // recorded an employee's acceptance against their company, so the gate kept refusing them for ever.
    const credentialId = actingCredentialId(req.user);
    if (!credentialId) {
        return res.status(400).json({ message: 'Session context is missing' });
    }

    const { policyIds } = req.body;

    await createPrivacyPolicyAcceptance({
        credentialId,
        policyIds,
        ipAddress: req.ip,
        userAgent: ua.source,
    });

    const redisKey = `userData_${userId}_${sessionId}`;
    const cachedUserData = await getValue(redisKey);

    if (cachedUserData) {

        const parsed = JSON.parse(cachedUserData);
        parsed.hasAcceptedPrivacyPolicy = true;
        await setValue(
            redisKey,
            expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY),
            JSON.stringify(parsed)
        );

    } else {
        console.log(`privacyPolicy accept: session cache miss for ${redisKey}, flag not patched (verifyToken will heal from DB)`);
    }

    res.status(200).json({ status: true, message: 'Privacy policy accepted successfully', data: {}, responseCode: '000' });
});

exports.getAllUserPendingPolicies = asyncHandler(async (req, res) => {
    // Must be the same credential the gate refuses on, or the caller is told to accept a policy this
    // returns nothing for — a modal that closes itself over a screen that never loads.
    const credentialId = actingCredentialId(req.user);
    if (!credentialId) {
        return res.status(400).json({ message: 'Session context is missing' });
    }

    const policies = await getPendingPrivacyPolicies({ credentialId });

    return res.status(200).json({
        status: true,
        message: 'Privacy policies fetched successfully',
        responseCode: '000',
        data: policies
    });
});
