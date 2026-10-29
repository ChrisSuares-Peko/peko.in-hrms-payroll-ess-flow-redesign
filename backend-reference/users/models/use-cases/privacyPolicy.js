const PrivacyPolicyAcceptance = require('../entities/privacyPolicyAcceptances');
const Credential = require('../entities/credential');
const PrivacyPolicyDetails = require('../entities/privacyPolicyDetails');
const asyncHandler = require("../../middlewares/async");
const { Op } = require('sequelize');


exports.createPrivacyPolicyAcceptance
    = asyncHandler(async ({
        credentialId,
        policyIds,
        ipAddress,
        userAgent,
    }) => {
        // policyIds is an object: { [id]: true | false }
        const allPolicyIds = Object.keys(policyIds || {}).map(Number).filter(Boolean);
        if (!allPolicyIds.length) return [];

        const credential = await Credential.findOne({
            where: { id: credentialId },
            raw: true
        });

    if (!credential) {
        throw new Error('Credential not found for the corporate user');
    }

        const existing = await PrivacyPolicyAcceptance.findAll({
            where: { credentialId, privacyPolicyId: { [Op.in]: allPolicyIds } },
            attributes: ['privacyPolicyId'],
            raw: true
        });

        const existingIds = new Set(existing.map(r => r.privacyPolicyId));
        const newPolicyIds = allPolicyIds.filter(id => !existingIds.has(id));

        if (!newPolicyIds.length) return [];

        const acceptedAt = new Date();
        const records = newPolicyIds.map(privacyPolicyId => ({
            credentialId,
            privacyPolicyId,
            isAccepted: policyIds[privacyPolicyId] === true,
            acceptedAt,
            ipAddress,
            deviceDetails: userAgent,
            authorizedSignatoryName: credential.name,
            authorizedSignatoryRole: credential.role,
        }));

        return await PrivacyPolicyAcceptance.bulkCreate(records);
    });

exports.getPendingPrivacyPolicies = asyncHandler(async ({ credentialId }) => {
    const acceptances = await PrivacyPolicyAcceptance.findAll({
        where: { credentialId },
        attributes: ['privacyPolicyId'],
        raw: true
    });

    const processedIds = acceptances.map(a => a.privacyPolicyId).filter(id => id !== null);

    const whereClause = { status: 'ACTIVE' };
    if (processedIds.length) {
        whereClause.id = { [Op.notIn]: processedIds };
    }

    return await PrivacyPolicyDetails.findAll({
        where: whereClause,
        attributes: ['id', 'privacyPolicyRegistrationText', 'effectiveFrom', 'isMandatory', 'hyperLinkText', 'validationText'],
         order: [['id', 'ASC']],
        raw: true
    });
});


exports.checkAllPoliciesAccepted = asyncHandler(async ({ credentialId }) => {
    const activePolicies = await PrivacyPolicyDetails.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['id'],
        raw: true
    });

    if (!activePolicies.length) return true;

    const activePolicyIds = activePolicies.map(p => p.id);

    const processedCount = await PrivacyPolicyAcceptance.count({
        where: {
            credentialId,
            privacyPolicyId: { [Op.in]: activePolicyIds }
        }
    });

    return processedCount === activePolicyIds.length;
});
